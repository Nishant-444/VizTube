import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from '../utils/cloudinary.js';
import { CloudinaryResponse } from '../types/cloudinary.types.js';
import prisma from '../lib/prisma.js';
import fs from 'fs';

// helper function
const removeLocalFile = (localPath: string) => {
  if (localPath && fs.existsSync(localPath)) {
    fs.unlinkSync(localPath);
  }
};

// exported functions
const publishAVideo = asyncHandler(async (req, res) => {
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { title, description } = req.body;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const videoLocalPath = files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = files?.thumbnail?.[0]?.path;

  if (!title || title.trim() === '') {
    if (videoLocalPath) removeLocalFile(videoLocalPath);
    if (thumbnailLocalPath) removeLocalFile(thumbnailLocalPath);
    throw new ApiError(400, 'Title is required');
  }
  if (!videoLocalPath) {
    throw new ApiError(400, 'Video file is required');
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, 'Thumbnail file is required');
  }

  let videoUpload: CloudinaryResponse | null = null;
  let thumbnailUpload: CloudinaryResponse | null = null;

  try {
    videoUpload = await uploadOnCloudinary(videoLocalPath);
    thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoUpload || !thumbnailUpload) {
      throw new ApiError(500, 'Failed to upload video or thumbnail');
    }

    const video = await prisma.video.create({
      data: {
        title,
        description: description || '',

        videoFileUrl: videoUpload.url,
        videoFilePublicId: videoUpload.public_id,
        thumbnailUrl: thumbnailUpload.url,
        thumbnailPublicId: thumbnailUpload.public_id,

        duration: videoUpload.duration || 0,

        isPublished: true,
        userId: req.user.id,
      },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, video, 'Video published successfully'));
  } catch (error) {
    console.error('Video Publication Failed. Rolling back uploads...');

    if (videoUpload?.public_id) {
      await deleteFromCloudinary(videoUpload.public_id);
    }
    if (thumbnailUpload?.public_id) {
      await deleteFromCloudinary(thumbnailUpload.public_id);
    }

    throw new ApiError(
      500,
      'Something went wrong while publishing the video. Files were deleted.'
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const videoIdInt = parseInt(videoId);
  if (isNaN(videoIdInt)) {
    throw new ApiError(400, 'Invalid video ID');
  }

  if (req.user?.id) {
    await prisma.watchHistory.upsert({
      where: {
        userId_videoId: {
          userId: req.user.id,
          videoId: videoIdInt,
        },
      },
      create: {
        userId: req.user.id,
        videoId: videoIdInt,
      },
      update: {
        watchedAt: new Date(),
      },
    });
  }

  const video = await prisma.video.update({
    where: { id: videoIdInt },
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
    // We override the original 'user' field with the cleaned version
    user: {
      ...restOfUser,
      subscribersCount: _count.subscribers, // Move the count to a cleaner spot
    },
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, 'Video fetched successfully'));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  const videoIdInt = parseInt(videoId);
  if (isNaN(videoIdInt)) throw new ApiError(400, 'Invalid video ID');

  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');

  const video = await prisma.video.findUnique({
    where: { id: videoIdInt },
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
      where: { id: videoIdInt },
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
  const { videoId } = req.params;

  const videoIdInt = parseInt(videoId);
  if (isNaN(videoIdInt)) throw new ApiError(400, 'Invalid video ID');

  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');
  const video = await prisma.video.findUnique({
    where: { id: videoIdInt },
  });

  if (!video) throw new ApiError(404, 'Video not found');

  if (video.userId !== req.user.id) {
    throw new ApiError(403, 'You are not authorized to delete this video');
  }

  await prisma.video.delete({
    where: { id: videoIdInt },
  });

  const cleanupFiles = async () => {
    try {
      if (video.videoFilePublicId) {
        await deleteFromCloudinary(video.videoFilePublicId);
      }
      if (video.thumbnailPublicId) {
        await deleteFromCloudinary(video.thumbnailPublicId);
      }
    } catch (error) {
      console.error('Failed to delete files from Cloudinary:', error);
    }
  };
  cleanupFiles();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Video deleted successfully'));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const videoIdInt = parseInt(videoId);
  if (isNaN(videoIdInt)) throw new ApiError(400, 'Invalid video ID');

  const video = await prisma.video.findUnique({
    where: { id: videoIdInt },
  });

  if (!video) throw new ApiError(404, 'Video not found');

  if (video.userId !== req.user?.id) {
    throw new ApiError(403, 'Unauthorized');
  }

  const updatedVideo = await prisma.video.update({
    where: { id: videoIdInt },
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
    whereCondition.userId = parseInt(userId as string);
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
