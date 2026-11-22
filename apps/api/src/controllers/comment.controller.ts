import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { prisma } from '../lib/prisma.js';
import { getSingleParam } from '../utils/normalize.js';

const commentInclude = {
  user: {
    select: {
      username: true,
      fullname: true,
      avatar: true,
    },
  },
} as const;

const getPagination = (query: Record<string, unknown>) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

// comments on unpublished videos are only visible to the video's owner
const findVisibleVideo = async (videoId: string, viewerId?: string) => {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true, userId: true, isPublished: true },
  });
  if (!video || (!video.isPublished && video.userId !== viewerId)) {
    throw new ApiError(404, 'Video not found');
  }
  return video;
};

// top-level comment, or a reply when `parentId` is given (one level deep)
const addComment = asyncHandler(async (req, res) => {
  const { content, parentId } = req.body;
  const userId = req.user!.id;

  const videoId = getSingleParam(req.params.videoId);
  if (!videoId) throw new ApiError(400, 'Invalid video ID');

  if (typeof content !== 'string' || content.trim() === '') {
    throw new ApiError(400, 'Comment cannot be empty');
  }

  await findVisibleVideo(videoId, userId);

  if (parentId !== undefined && parentId !== null) {
    if (typeof parentId !== 'string') {
      throw new ApiError(400, 'Invalid parent comment ID');
    }
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { videoId: true, parentId: true },
    });
    if (!parent || parent.videoId !== videoId) {
      throw new ApiError(404, 'Parent comment not found on this video');
    }
    if (parent.parentId) {
      throw new ApiError(400, 'Replies can only be one level deep');
    }
  }

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      userId,
      videoId,
      parentId: parentId ?? null,
    },
    include: commentInclude,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, 'Comment added successfully'));
});

// public; top-level comments with their reply counts
const getVideoComments = asyncHandler(async (req, res) => {
  const videoId = getSingleParam(req.params.videoId);
  if (!videoId) throw new ApiError(400, 'Invalid video ID');

  await findVisibleVideo(videoId, req.user?.id);

  const { skip, limit } = getPagination(req.query);

  const comments = await prisma.comment.findMany({
    where: { videoId, parentId: null },
    include: {
      ...commentInclude,
      _count: { select: { replies: true } },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip,
    take: limit,
  });

  const data = comments.map(({ _count, ...comment }) => ({
    ...comment,
    replyCount: _count.replies,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, data, 'Comments fetched successfully'));
});

// public; replies to a top-level comment, oldest first
const getCommentReplies = asyncHandler(async (req, res) => {
  const commentId = getSingleParam(req.params.commentId);
  if (!commentId) throw new ApiError(400, 'Invalid comment ID');

  const parent = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { videoId: true },
  });
  if (!parent) throw new ApiError(404, 'Comment not found');

  await findVisibleVideo(parent.videoId, req.user?.id);

  const { skip, limit } = getPagination(req.query);

  const replies = await prisma.comment.findMany({
    where: { parentId: commentId },
    include: commentInclude,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    skip,
    take: limit,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, replies, 'Replies fetched successfully'));
});

const deleteComment = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const commentId = getSingleParam(req.params.commentId);

  if (!commentId) throw new ApiError(400, 'Invalid comment ID');

  try {
    await prisma.comment.delete({
      where: {
        id: commentId,
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
  const { content } = req.body;
  const userId = req.user?.id;
  const commentId = getSingleParam(req.params.commentId);

  if (!commentId) throw new ApiError(400, 'Invalid comment ID');
  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Content is required');
  }

  try {
    const updatedComment = await prisma.comment.update({
      where: {
        id: commentId,
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

export {
  addComment,
  getVideoComments,
  getCommentReplies,
  deleteComment,
  updateComment,
};
