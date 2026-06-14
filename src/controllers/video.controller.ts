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
import path, { normalize } from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { triggerBackgroundIngestion } from '../utils/aiPipeline.js';
import { getSingleParam } from '../utils/normalize.js';

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
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');

  const { title, description, generateTranscript, allowPublicQnA } = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const maxVideoDuration = parseInt(
    process.env.MAX_VIDEO_DURATION || '120',
    10
  );

  const videoLocalPath = files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = files?.thumbnail?.[0]?.path;

  if (!title || !videoLocalPath || !thumbnailLocalPath) {
    if (videoLocalPath) removeLocalFile(videoLocalPath);
    if (thumbnailLocalPath) removeLocalFile(thumbnailLocalPath);
    throw new ApiError(
      400,
      'Title, Video file, and Thumbnail are all required'
    );
  }

  let videoUpload: CloudinaryResponse | null = null;
  let thumbnailUpload: CloudinaryResponse | null = null;

  // NOTE: currently we are first uploading the video on cloudinary then checking the duration, which is not good for scale, future plan to use ffprobe and check the duration of the file in the public/temp folder before starting a request to cloudinary
  // Also need to do stream in chunks for better processing and lesser load and resource usage

  try {
    videoUpload = await uploadOnCloudinary(videoLocalPath);
    const duration = videoUpload?.duration ?? 0;
    if (duration > maxVideoDuration) {
      await deleteFromCloudinary(videoUpload?.public_id as string);
      throw new ApiError(
        400,
        `Video exceeds the maximum allowed duration of ${maxVideoDuration} seconds.`
      );
    }

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
        hasTranscript: generateTranscript === 'true',
        allowPublicQnA: allowPublicQnA === 'true',
      },
    });
    if (video.hasTranscript) {
      triggerBackgroundIngestion(video.id, videoLocalPath).catch((err) => {
        console.error('AI trigger failed:', err);
      });
    } else {
      removeLocalFile(videoLocalPath);
    }

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

    throw new ApiError(500, 'Video publication failed');
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
        await deleteFromCloudinary(video.videoFilePublicId);
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

const uploadAndIngestVideo = asyncHandler(async (req, res) => {
  try {
    // 1. Ensure Multer caught the file locally
    const videoFile = req.file;
    if (!videoFile) {
      return res
        .status(400)
        .json({ success: false, message: 'No video file provided' });
    }

    // 2. Generate a unique ID or use the database record ID
    const videoId = `vid_${Date.now()}`;

    // 3. Prepare the multipart form data for the Python AI Worker
    const formData = new FormData();
    formData.append('video_id', videoId);
    // Create a read stream from the local temp disk file
    formData.append('file', fs.createReadStream(videoFile.path), {
      filename: videoFile.originalname,
      contentType: videoFile.mimetype,
    });

    // 4. Fire internal HTTP request to the local FastAPI worker
    const aiWorkerUrl = 'http://localhost:8000/api/rag/ingest';
    const aiResponse = await axios.post(aiWorkerUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // 5. Clean up the local temp file after processing
    fs.unlinkSync(videoFile.path);

    // 6. Return response to client or proceed to save metadata in PostgreSQL
    return res.status(200).json({
      success: true,
      message: 'Video uploaded and ingested into AI pipeline successfully.',
      data: {
        videoId,
        aiWorkerStatus: aiResponse.data,
      },
    });
  } catch (error: any) {
    // Ensure file cleanup if error occurs mid-stream
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Internal service ingestion failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'AI Ingestion failed.',
      error: error.response?.data || error.message,
    });
  }
});

// 6 exports
export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  uploadAndIngestVideo,
};
