import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import prisma from '../lib/prisma.js';

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Tweet content cannot be empty.');
  }

  const tweet = await prisma.tweet.create({
    data: {
      content: content,
      userId: userId,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, 'Tweet created successfully!'));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const userIdInt = parseInt(userId);
  if (isNaN(userIdInt)) throw new ApiError(400, 'Invalid user ID');

  const tweets = await prisma.tweet.findMany({
    where: {
      userId: userIdInt,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      _count: {
        select: { likes: true },
      },
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, 'Tweets fetched successfully'));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  const tweetIdInt = parseInt(tweetId);
  if (isNaN(tweetIdInt)) throw new ApiError(400, 'Invalid tweet ID');

  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Content cannot be empty');
  }

  try {
    const updatedTweet = await prisma.tweet.update({
      where: {
        id: tweetIdInt,
        userId: userId,
      },
      data: {
        content: content,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, updatedTweet, 'Tweet updated successfully'));
  } catch (error) {
    throw new ApiError(403, 'Tweet not found or unauthorized');
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user.id;

  const tweetIdInt = parseInt(tweetId);
  if (isNaN(tweetIdInt)) throw new ApiError(400, 'Invalid tweet ID');

  try {
    await prisma.tweet.delete({
      where: {
        id: tweetIdInt,
        userId: userId,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Tweet deleted successfully'));
  } catch (error) {
    throw new ApiError(403, 'Tweet not found or unauthorized');
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
