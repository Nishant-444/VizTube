import mongoose from 'mongoose';
import { Like } from '../models/like.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Video } from '../models/video.model.js';
import { Comment } from '../models/comment.model.js';
import { Tweet } from '../models/tweet.model.js';
import { paginationOptions } from '../config/paginationOptions.js';

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized - no user in request');
  }
  const userId = req.user._id;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  const likeConditions = {
    video: videoId,
    likedBy: userId,
  };

  const deletedLike = await Like.findOneAndDelete(likeConditions);

  if (deletedLike) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { liked: false }, 'Like removed successfully')
      );
  }

  const newLike = await Like.create(likeConditions);
  if (!newLike) {
    throw new ApiError(500, 'Failed to add like');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newLike, 'Like added successfully'));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized - no user in request');
  }
  const userId = req.user._id;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  const likeConditions = {
    comment: commentId,
    likedBy: userId,
  };

  const deletedLike = await Like.findOneAndDelete(likeConditions);

  if (deletedLike) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { liked: false }, 'Like removed successfully')
      );
  }

  const newLike = await Like.create(likeConditions);
  if (!newLike) {
    throw new ApiError(500, 'Failed to add like');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newLike, 'Like added successfully'));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized - no user in request');
  }
  const userId = req.user._id;

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, 'Tweet not found');
  }

  const likeConditions = {
    tweet: tweetId,
    likedBy: userId,
  };

  const deletedLike = await Like.findOneAndDelete(likeConditions);

  if (deletedLike) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { liked: false }, 'Like removed successfully')
      );
  }

  const newLike = await Like.create(likeConditions);
  if (!newLike) {
    throw new ApiError(500, 'Failed to add like');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newLike, 'Like added successfully'));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized - no user in request');
  }
  const userId = req.user._id;
  // const { page = 1, limit = 10 } = req.query;

  const pipeline: any[] = [
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        video: { $exists: true },
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'video',
        foreignField: '_id',
        as: 'likedVideo',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'ownerDetails',
            },
          },
          { $unwind: '$ownerDetails' },
          {
            $project: {
              'owner.username': '$ownerDetails.username',
              'owner.avatar': '$ownerDetails.avatar',
              title: 1,
              thumbnail: 1,
              duration: 1,
              views: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    { $unwind: '$likedVideo' },
    { $replaceRoot: { newRoot: '$likedVideo' } },
    { $sort: { createdAt: -1 } },
  ];

  const likeAggregate = Like.aggregate(pipeline);

  if (!Like.aggregatePaginate) {
    throw new ApiError(
      500,
      'aggregatePaginate is not a function on Like model. Did you add the plugin in like.model.js?'
    );
  }

  const likedVideos = await Like.aggregatePaginate(
    likeAggregate,
    paginationOptions
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, 'Liked videos fetched successfully')
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
