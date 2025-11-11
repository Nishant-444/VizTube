import mongoose, { isValidObjectId } from 'mongoose';
import { Tweet } from '../models/tweet.model.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paginationOptions } from '../config/paginationOptions.js';

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user._id;

  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Tweet content cannot be empty.');
  }

  const tweet = await Tweet.create({
    content,
    owner: userId,
  });

  if (!tweet) {
    throw new ApiError(500, 'Something went wrong while creating the tweet');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, 'Tweet created successfully!'));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const pipeline = [];

  pipeline.push(
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    }
  );

  const tweetAggregate = Tweet.aggregate(pipeline);
  const results = await Tweet.aggregatePaginate(
    tweetAggregate,
    paginationOptions
  );

  return res
    .status(200)
    .json(new ApiResponse(200, results, 'Tweets fetched successfully'));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === '') {
    throw new ApiError(400, 'Tweet content cannot be empty.');
  }

  const { tweetId } = req.params;

  const updatedTweet = await Tweet.findOneAndUpdate(
    {
      _id: tweetId,
      owner: req.user._id,
    },
    {
      $set: {
        content: content,
      },
    },
    { new: true }
  );

  if (!updatedTweet) {
    throw new ApiError(404, 'Tweet not found or you are not authorized');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, 'Tweet updated successfully'));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const deletedTweet = await Tweet.findOneAndDelete({
    _id: tweetId,
    owner: req.user._id,
  });

  if (!deletedTweet) {
    throw new ApiError(404, 'Tweet not found or you are not authorized');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Tweet deleted successfully'));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
