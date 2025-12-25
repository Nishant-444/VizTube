import mongoose from 'mongoose';
import { Video } from '../models/video.model.js';
import { Subscription } from '../models/subscription.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getChannelStats = asyncHandler(async (req, res) => {
  const channelId = req.user?._id;

  const totalVideos = await Video.countDocuments({ owner: channelId });

  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  const videoStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: '$views' },
      },
    },
  ]);

  const totalViews = videoStats[0]?.totalViews || 0;

  const likesStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'video',
        as: 'videoLikes',
      },
    },
    {
      $addFields: {
        likesCount: { $size: '$videoLikes' },
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: '$likesCount' },
      },
    },
  ]);

  const totalLikes = likesStats[0]?.totalLikes || 0;

  const stats = {
    totalVideos,
    totalSubscribers,
    totalViews,
    totalLikes,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, 'Channel stats fetched successfully'));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const channelId = req.user?._id;

  const videos = await Video.find({ owner: channelId }).sort({
    createdAt: -1,
  });

  if (!videos) {
    throw new ApiError(500, 'Error fetching channel videos');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, 'Channel videos fetched successfully'));
});

export { getChannelStats, getChannelVideos };
