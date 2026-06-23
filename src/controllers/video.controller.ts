import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from '../utils/cloudinary.js';
import { CloudinaryResponse } from '../types/cloudinary.types.js';
import { prisma } from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import { getSingleParam } from '../utils/normalize.js';
import { ProcessingStatus } from '../generated/client/enums.js';
import { triggerBackgroundIngestion } from '../utils/aiPipeline.js';

const projectTempDir = path.resolve(process.cwd(), 'public', 'temp');
const containerTempDir = path.resolve('/app', 'public', 'temp');

const isTempPath = (targetPath: string) => {
  const resolved = path.resolve(targetPath);
  return (
    resolved.startsWith(`${projectTempDir}${path.sep}`) ||
    resolved.startsWith(`${containerTempDir}${path.sep}`)
  );
};

// helper function
const removeLocalFile = (localPath: string) => {
  if (!localPath || !isTempPath(localPath)) {
    return;
  }

  try {
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EACCES') {
      console.error(
        `EACCES: Permission denied deleting file ${localPath}`,
        error
      );
      return;
    }
    throw error;
  }
};

// exported functions
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user?.id;
  
  if (!userId) throw new ApiError(401, 'Unauthorized');
  if (!title) throw new ApiError(400, 'Title is required');

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const videoLocalPath = files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = files?.thumbnail?.[0]?.path;

  if (!videoLocalPath) throw new ApiError(400, 'Video file is required');
  if (!thumbnailLocalPath) {
    fs.unlinkSync(videoLocalPath);
    throw new ApiError(400, 'Thumbnail is required');
  }

  let videoRecordId: string | null = null;

  try {
    const [videoUpload, thumbnailUpload] = await Promise.all([
      uploadOnCloudinary(videoLocalPath),
      uploadOnCloudinary(thumbnailLocalPath),
    ]);

    if (!videoUpload || !thumbnailUpload) {
      throw new ApiError(500, 'Failed to upload files to cloud storage');
    }

    const videoRecord = await prisma.video.create({
      data: {
        title,
        description: description || '',
        videoFileUrl: videoUpload.url,
        videoFilePublicId: videoUpload.public_id,
        thumbnailUrl: thumbnailUpload.url,
        thumbnailPublicId: thumbnailUpload.public_id,
        duration: videoUpload.duration || 0,
        processingStatus: ProcessingStatus.PROCESSING,
        isPublished: true,
        userId: userId,
      },
    });

    videoRecordId = videoRecord.id;

    const aiResponse = triggerBackgroundIngestion(
      videoRecord.id,
      videoLocalPath
    ).catch((err) => console.error('Background AI trigger failed: ', err));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          video: videoRecord,
        },
        'Video published successfully. AI ingestion started in the background.'
      )
    );
  } catch (error: any) {
    if (videoRecordId) {
      await prisma.video
        .update({
          where: { id: videoRecordId },
          data: { processingStatus: ProcessingStatus.FAILED },
        })
        .catch((e) => console.error('Failed to update status', e));
    }
    throw new ApiError(500, error?.message || 'Error publishing video');
  } finally {
    if (thumbnailLocalPath) {
      removeLocalFile(thumbnailLocalPath);
      console.log(`[Gateway Janitor] Cleared thumbnail: ${thumbnailLocalPath}`);
    }
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const videoId = getSingleParam(req.params.videoId);

  if (!videoId) throw new ApiError(400, 'Invalid video ID');

  if (req.user?.id) {
    await prisma.watchHistory.upsert({
      where: {
        userId_videoId: {
          userId: req.user.id,
          videoId: videoId,
        },
      },
      create: {
        userId: req.user.id,
        videoId: videoId,
      },
      update: {
        watchedAt: new Date(),
      },
    });
  }

  const video = await prisma.video.update({
    where: { id: videoId },
    data: {
      views: { increment: 1 },
    },
    include: {
      user: {
        select: {
          fullname: true,
          username: true,
          avatar: true,
          _count: {
            select: { subscribers: true },
          },
        },
      },
    },
  });

  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  const { _count, ...restOfUser } = video.user;

  const responseData = {
    ...video,
    user: {
      ...restOfUser,
      subscribersCount: _count.subscribers,
    },
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, 'Video fetched successfully'));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoId = getSingleParam(req.params.videoId);

  if (!videoId) {
    throw new ApiError(400, 'Invalid or missing video ID');
  }
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');

  const video = await prisma.video.findUnique({
    where: { id: videoId },
  });

  if (!video) throw new ApiError(404, 'Video not found');

  if (video.userId !== req.user.id) {
    throw new ApiError(403, 'You are not authorized to update this video');
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const thumbnailLocalPath = files?.thumbnail?.[0]?.path;

  let thumbnailUpload: CloudinaryResponse | null = null;

  try {
    if (thumbnailLocalPath) {
      thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);
      if (!thumbnailUpload)
        throw new ApiError(500, 'Failed to upload new thumbnail');
    }

    const updatedVideo = await prisma.video.update({
      where: { id: videoId },
      data: {
        title: title || undefined,
        description: description || undefined,

        thumbnailUrl: thumbnailUpload?.url || undefined,
        thumbnailPublicId: thumbnailUpload?.public_id || undefined,
      },
    });

    if (thumbnailUpload && video.thumbnailPublicId) {
      deleteFromCloudinary(video.thumbnailPublicId).catch((err) =>
        console.error('Failed to delete old thumbnail', err)
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, 'Video updated successfully'));
  } catch (error) {
    if (thumbnailUpload?.public_id) {
      await deleteFromCloudinary(thumbnailUpload.public_id);
    }

    throw error;
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const videoId = getSingleParam(req.params.videoId);

  if (!videoId) {
    throw new ApiError(400, 'Invalid or missing video ID');
  }
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');

  const video = await prisma.video.findUnique({
    where: { id: videoId },
  });

  if (!video) throw new ApiError(404, 'Video not found');

  if (video.userId !== req.user.id) {
    throw new ApiError(403, 'You are not authorized to delete this video');
  }

  await prisma.video.delete({
    where: { id: videoId },
  });

  const cleanupFiles = async () => {
    try {
      if (video.videoFilePublicId) {
        await deleteFromCloudinary(video.videoFilePublicId, 'video');
      }
      if (video.thumbnailPublicId) {
        await deleteFromCloudinary(video.thumbnailPublicId);
      }
    } catch (error) {
      console.error('Failed to delete files from Cloudinary:', error);
    }
  };
  await cleanupFiles();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Video deleted successfully'));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const videoId = getSingleParam(req.params.videoId);

  if (!videoId) {
    throw new ApiError(400, 'Invalid or missing video ID');
  }
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');

  const video = await prisma.video.findUnique({
    where: { id: videoId },
  });

  if (!video) throw new ApiError(404, 'Video not found');

  if (video.userId !== req.user?.id) {
    throw new ApiError(403, 'Unauthorized');
  }

  const updatedVideo = await prisma.video.update({
    where: { id: videoId },
    data: {
      isPublished: !video.isPublished,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, 'Video publish status toggled'));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { query, sortBy, sortType, userId } = req.query;

  const whereCondition: any = {
    isPublished: true,
  };

  if (query) {
    whereCondition.OR = [
      { title: { contains: query as string, mode: 'insensitive' } },
      { description: { contains: query as string, mode: 'insensitive' } },
    ];
  }

  if (userId) {
    whereCondition.userId = userId as string;
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const videos = await prisma.video.findMany({
    where: whereCondition,
    orderBy: {
      [(sortBy as string) || 'createdAt']: sortType === 'asc' ? 'asc' : 'desc',
    },
    skip: skip,
    take: limit,
    include: {
      user: {
        select: { fullname: true, username: true, avatar: true },
      },
    },
  });

  const totalDocs = await prisma.video.count({ where: whereCondition });
  const totalPages = Math.ceil(totalDocs / limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        docs: videos,
        totalDocs,
        limit,
        page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      'Videos fetched successfully'
    )
  );
});

// 6 exports
export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
