import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Subscription } from '../models/subscription.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized - no user in request');
  }
  const subscriberId = req.user._id;

  if (channelId.toString() === subscriberId.toString()) {
    throw new ApiError(400, 'You cannot subscribe to your own channel');
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, 'Channel not found');
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  let subscriptionStatus;
  let statusCode;

  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id);
    subscriptionStatus = { subscribed: false };
    statusCode = 200;
  } else {
    await Subscription.create({
      subscriber: subscriberId,
      channel: channelId,
    });
    subscriptionStatus = { subscribed: true };
    statusCode = 201;
  }

  return res
    .status(statusCode)
    .json(
      new ApiResponse(
        statusCode,
        subscriptionStatus,
        'Subscription toggled successfully'
      )
    );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, 'Channel ID is required');
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'subscriber',
        foreignField: '_id',
        as: 'subscriberDetails',
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: '$subscriberDetails',
    },
    {
      $replaceRoot: {
        newRoot: '$subscriberDetails',
      },
    },
  ]);

  if (!subscribers) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], 'No subscribers found'));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, 'Subscribers list fetched successfully')
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId) {
    throw new ApiError(400, 'Subscriber ID is required');
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'channel',
        foreignField: '_id',
        as: 'channelDetails',
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: '$channelDetails',
    },
    {
      $replaceRoot: {
        newRoot: '$channelDetails',
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        'Subscribed channels fetched successfully'
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
