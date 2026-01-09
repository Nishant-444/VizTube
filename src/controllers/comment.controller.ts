import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { prisma } from '../lib/prisma.js';

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  const videoIdInt = parseInt(videoId);
  if (isNaN(videoIdInt)) throw new ApiError(400, 'Invalid video ID');

  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Comment cannot be empty');
  }

  const video = await prisma.video.findUnique({
    where: { id: videoIdInt },
  });

  if (!video) throw new ApiError(404, 'Video not found');

  const comment = await prisma.comment.create({
    data: {
      content: content,
      videoId: videoIdInt,
      userId: userId,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, 'Comment added successfully'));
});

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const videoIdInt = parseInt(videoId);
  if (isNaN(videoIdInt)) throw new ApiError(400, 'Invalid video ID');

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const comments = await prisma.comment.findMany({
    where: {
      videoId: videoIdInt,
    },
    include: {
      user: {
        select: {
          username: true,
          fullname: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: skip,
    take: limit,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, comments, 'Comments fetched successfully'));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  const commentIdInt = parseInt(commentId);
  if (isNaN(commentIdInt)) throw new ApiError(400, 'Invalid comment ID');

  try {
    await prisma.comment.delete({
      where: {
        id: commentIdInt,
        userId: userId,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Comment deleted successfully'));
  } catch (error) {
    throw new ApiError(
      403,
      'Comment not found or you are not authorized to delete it'
    );
  }
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  const commentIdInt = parseInt(commentId);
  if (isNaN(commentIdInt)) throw new ApiError(400, 'Invalid comment ID');

  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Content is required');
  }

  try {
    const updatedComment = await prisma.comment.update({
      where: {
        id: commentIdInt,
        userId: userId,
      },
      data: {
        content: content,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedComment, 'Comment updated successfully')
      );
  } catch (error) {
    throw new ApiError(
      403,
      'Comment not found or you are not authorized to edit it'
    );
  }
});

export { addComment, getVideoComments, deleteComment, updateComment };
