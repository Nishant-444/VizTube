import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import prisma from '../lib/prisma.js';

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user.id;

  const videoIdInt = parseInt(videoId);
  if (isNaN(videoIdInt)) throw new ApiError(400, 'Invalid video ID');

  const existingLike = await prisma.like.findFirst({
    where: {
      videoId: videoIdInt,
      userId: userId,
    },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: {
        id: existingLike.id,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { liked: false }, 'Like removed successfully')
      );
  } else {
    await prisma.like.create({
      data: {
        videoId: videoIdInt,
        userId: userId,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { liked: true }, 'Like added successfully'));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  const commentIdInt = parseInt(commentId);
  if (isNaN(commentIdInt)) throw new ApiError(400, 'Invalid comment ID');

  const existingLike = await prisma.like.findFirst({
    where: {
      commentId: commentIdInt,
      userId: userId,
    },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: {
        id: existingLike.id,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { liked: false }, 'Like removed successfully')
      );
  } else {
    await prisma.like.create({
      data: {
        commentId: commentIdInt,
        userId: userId,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { liked: true }, 'Like added successfully'));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user.id;

  const tweetIdInt = parseInt(tweetId);
  if (isNaN(tweetIdInt)) throw new ApiError(400, 'Invalid tweet ID');

  const existingLike = await prisma.like.findFirst({
    where: {
      tweetId: tweetIdInt,
      userId: userId,
    },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: {
        id: existingLike.id,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { liked: false }, 'Like removed successfully')
      );
  } else {
    await prisma.like.create({
      data: {
        tweetId: tweetIdInt,
        userId: userId,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { liked: true }, 'Like added successfully'));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const likedVideos = await prisma.like.findMany({
    where: {
      userId: userId,
      videoId: {
        not: null,
      },
    },

    include: {
      video: {
        include: {
          user: {
            select: {
              username: true,
              fullname: true,
              avatar: true,
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: 'desc',
    },
  });

  const formattedVideos = likedVideos.map((item) => item.video);

  return res
    .status(200)
    .json(
      new ApiResponse(200, formattedVideos, 'Liked videos fetched successfully')
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
