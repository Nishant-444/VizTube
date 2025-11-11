import mongoose from 'mongoose';
import { Comment } from '../models/comment.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Video } from '../models/video.model.js';
import { paginationOptions } from '../config/paginationOptions.js';

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const { content } = req.body;

  const ownerId = req.user._id;

  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Comment cannot be empty.');
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  const comment = await Comment.create({
    content: content,
    owner: ownerId,
    video: videoId,
  });

  if (!comment) {
    throw new ApiError(500, 'Something went wrong while commenting');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, 'Comment created successfully!'));
});

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  const pipeline = [];

  pipeline.push(
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'ownerDetails',
      },
    },
    {
      $unwind: '$ownerDetails',
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        owner: {
          _id: '$ownerDetails._id',
          username: '$ownerDetails.username',
          avatar: '$ownerDetails.avatar',
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    }
  );

  const commentAggregate = Comment.aggregate(pipeline);
  const comments = await Comment.aggregatePaginate(
    commentAggregate,
    paginationOptions
  );

  return res
    .status(200)
    .json(new ApiResponse(200, comments, 'Comments fetched successfully!'));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Comment cannot be empty.');
  }

  const updatedComment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      owner: userId,
    },
    {
      $set: {
        content: content,
      },
    },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(404, 'Comment not found or you are not authorized');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, 'Comment updated successfully'));
});

const deleteComment = asyncHandler(async (req, res) => {
  // 1. Get the 'commentId' from the request parameters (req.params).
  // 2. (Important) Validate the 'commentId' (e.g., isValidObjectId).
  //    (You should add the validateMongoId('commentId') middleware to this route).
  const { commentId } = req.params;

  // 3. Use 'findOneAndDelete' to find the comment and delete it atomically.
  //    Query: Find a comment where '_id' matches 'commentId' AND 'owner' matches 'req.user._id'.
  const deletedComment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: req.user._id,
  });

  // 4. Check if the 'deletedComment' is null.
  //    (If it's null, it means either the comment wasn't found OR the user was not the owner).
  // 5. If null, throw a 404 (Not Found or Not Authorized) ApiError.
  if (!deletedComment) {
    throw new ApiError(404, 'Comment not found or you are not authorized');
  }

  // 6. Send a 200 (OK) response with an empty object and a success message.
  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Comment deleted successfully'));
});

export { getVideoComments, addComment, updateComment, deleteComment };
