import mongoose from 'mongoose';
import { Video } from '../models/video.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from '../utils/cloudinary.js';
import { paginationOptions } from '../config/paginationOptions.js';
import { CloudinaryResponse } from '../types/cloudinary.types.js';

const publishAVideo = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized');
  }
  const { title, description } = req.body;
  const userId = req.user?._id;
  const { videoFile, thumbnail } = req.files as {
    videoFile: Express.Multer.File[];
    thumbnail: Express.Multer.File[];
  };

  if (!title || title.trim() === '') {
    throw new ApiError(400, 'Title is required');
  }

  if (!videoFile[0].path) {
    throw new ApiError(400, 'Video is required');
  }
  const videoFilePath = videoFile[0].path;

  if (!thumbnail[0].path) {
    throw new ApiError(400, 'Thumbnail is required');
  }
  const thumbnailPath = thumbnail[0].path;

  let videoFileUpload: CloudinaryResponse | null = null;

  let thumbnailUpload: CloudinaryResponse | null = null;

  try {
    videoFileUpload = await uploadOnCloudinary(videoFilePath);
    thumbnailUpload = await uploadOnCloudinary(thumbnailPath);

    const video = await Video.create({
      title,
      description: description || '', // optional
      videoFile: {
        url: videoFileUpload?.url,
        public_id: videoFileUpload?.public_id,
      },
      thumbnail: {
        url: thumbnailUpload?.url,
        public_id: thumbnailUpload?.public_id,
      },
      duration: 0, // TODO: Extract video duration with ffmpeg in Postgres migration
      owner: userId,
      isPublished: true,
    });

    if (!video) {
      throw new ApiError(500, 'Error creating video entry');
    }

    return res
      .status(201)
      .json(new ApiResponse(201, video, 'Video published successfully'));
  } catch (error) {
    console.log('Video uploading failed');
    if (videoFileUpload) {
      await deleteFromCloudinary(videoFileUpload.public_id);
    }
    if (thumbnailUpload) {
      await deleteFromCloudinary(thumbnailUpload.public_id);
    }

    throw new ApiError(
      500,
      'Something went wrong while uploading a video and media were deleted'
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // if (!isValidObjectId(videoId)) {
  //   throw new ApiError(400, 'Invalid video ID');
  // }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  if (req.user) {
    User.findByIdAndUpdate(req.user._id, {
      $addToSet: { watchHistory: videoId },
    }).exec();
  }

  video.views += 1;
  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, video, 'Video fetched successfully'));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { thumbnail } = req.files as { thumbnail?: Express.Multer.File[] };
  const { videoId } = req.params;
  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized');
  }

  // if (!isValidObjectId(videoId)) {
  //   throw new ApiError(400, 'Invalid video ID');
  // }
  if (!title && !description && !thumbnail) {
    throw new ApiError(
      400,
      'At least one field (title, description, or thumbnail) is required to update'
    );
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this video');
  }

  let thumbnailUploadResponse;
  let oldThumbnailPubId = video.thumbnail.public_id;

  if (thumbnail) {
    const thumbnailLocalPath = thumbnail?.[0]?.path;
    thumbnailUploadResponse = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnailUploadResponse) {
      throw new ApiError(500, 'Error uploading new thumbnail');
    }
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        ...(title && { title }),
        ...(description && { description }),
        ...(thumbnailUploadResponse && {
          thumbnail: {
            url: thumbnailUploadResponse.url,
            public_id: thumbnailUploadResponse.public_id,
          },
        }),
      },
    },
    { new: true }
  );

  if (thumbnailUploadResponse) {
    const uploadNewThumbnail = await deleteFromCloudinary(oldThumbnailPubId);
    if (!uploadNewThumbnail) {
      throw new ApiError(500, 'Error deleting old thumbnail from cloud');
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, 'Video details updated'));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized');
  }
  // if (!isValidObjectId(videoId)) {
  //   throw new ApiError(400, 'Invalid video ID');
  // }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this video');
  }

  const videoPublicId = video.videoFile.public_id;
  const thumbnailPublicId = video.thumbnail.public_id;

  const videoDocumentDelete = await Video.findByIdAndDelete(videoId);
  if (!videoDocumentDelete) {
    throw new ApiError(500, 'Error deleting video document from database');
  }

  res.status(200).json(new ApiResponse(200, {}, 'Video deleted successfully'));

  (async () => {
    try {
      if (videoPublicId) {
        await deleteFromCloudinary(videoPublicId);
      }
      if (thumbnailPublicId) {
        await deleteFromCloudinary(thumbnailPublicId);
      }
    } catch (error) {
      console.log(
        `Cleanup Error: Failed to delete files for video ${videoId}`,
        error
      );
    }
  })();
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized');
  }
  // if (!isValidObjectId(videoId)) {
  //   throw new ApiError(400, 'Invalid video ID');
  // }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this video');
  }

  video.isPublished = !video.isPublished;

  const updatedVideo = await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, 'Video publish status updated'));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { query, sortBy, sortType, userId } = req.query;

  const pipeline = [];
  const matchStage: any = {};

  if (userId) {
    const userIdStr = userId as string;
    if (!mongoose.Types.ObjectId.isValid(userIdStr)) {
      throw new ApiError(400, 'Invalid userId');
    }
    matchStage.owner = new mongoose.Types.ObjectId(userIdStr);
  }
  if (query) {
    matchStage.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
    ];
  }

  matchStage.isPublished = true;
  pipeline.push({ $match: matchStage });

  const sortStage: any = {};
  if (sortBy) {
    const sortByStr = sortBy as string;
    const sortTypeStr = sortType as string;
    sortStage[sortByStr] = sortTypeStr === 'asc' ? 1 : -1;
  } else {
    sortStage.createdAt = -1;
  }
  pipeline.push({ $sort: sortStage });

  const videoAggregate = Video.aggregate(pipeline);
  const results = await Video.aggregatePaginate(
    videoAggregate,
    paginationOptions
  );

  return res
    .status(200)
    .json(new ApiResponse(200, results, 'Videos fetched successfully'));
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
