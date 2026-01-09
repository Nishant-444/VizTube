import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { prisma } from '../lib/prisma.js';

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user.id;

  const channelIdInt = parseInt(channelId);
  if (isNaN(channelIdInt)) throw new ApiError(400, 'Invalid channel ID');

  if (channelIdInt === subscriberId) {
    throw new ApiError(400, 'You cannot subscribe to your own channel');
  }

  const channelExists = await prisma.user.count({
    where: { id: channelIdInt },
  });
  if (!channelExists) {
    throw new ApiError(404, 'Channel not found');
  }

  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      channelId: channelIdInt,
      subscriberId: subscriberId,
    },
  });

  if (existingSubscription) {
    await prisma.subscription.delete({
      where: {
        id: existingSubscription.id,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { subscribed: false }, 'Unsubscribed successfully')
      );
  } else {
    await prisma.subscription.create({
      data: {
        channelId: channelIdInt,
        subscriberId: subscriberId,
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { subscribed: true }, 'Subscribed successfully')
      );
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const channelIdInt = parseInt(channelId);

  if (isNaN(channelIdInt)) throw new ApiError(400, 'Invalid channel ID');

  const subscribers = await prisma.subscription.findMany({
    where: {
      channelId: channelIdInt,
    },
    include: {
      subscriber: {
        select: {
          username: true,
          fullname: true,
          avatar: true,
        },
      },
    },
  });

  const formattedSubscribers = subscribers.map((sub: any) => sub.subscriber);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        formattedSubscribers,
        'Subscribers fetched successfully'
      )
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  const subscriberIdInt = parseInt(subscriberId);

  if (isNaN(subscriberIdInt)) throw new ApiError(400, 'Invalid subscriber ID');

  const subscribedChannels = await prisma.subscription.findMany({
    where: {
      subscriberId: subscriberIdInt,
    },
    include: {
      channel: {
        select: {
          username: true,
          fullname: true,
          avatar: true,
        },
      },
    },
  });

  const formattedChannels = subscribedChannels.map((sub: any) => sub.channel);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        formattedChannels,
        'Subscribed channels fetched successfully'
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
