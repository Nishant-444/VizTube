import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { prisma } from '../lib/prisma.js';
import { getSingleParam } from '../utils/normalize.js';

const toggleSubscription = asyncHandler(async (req, res) => {
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');
  const subscriberId = req.user.id;

  const channelId = getSingleParam(req.params.channelId);
  if (!channelId) throw new ApiError(400, 'Invalid channel ID');

  if (channelId === subscriberId) {
    throw new ApiError(400, 'You cannot subscribe to your own channel');
  }

  const channelExists = await prisma.user.count({
    where: { id: channelId },
  });
  if (!channelExists) {
    throw new ApiError(404, 'Channel not found');
  }

  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      channelId: channelId,
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
        channelId: channelId,
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
  const channelId = getSingleParam(req.params.channelId);
  if (!channelId) throw new ApiError(400, 'Invalid channel ID');

  const subscribers = await prisma.subscription.findMany({
    where: {
      channelId: channelId,
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
  const subscriberId = getSingleParam(req.params.subscriberId);
  if (!subscriberId) throw new ApiError(400, 'Invalid subscriber ID');

  const subscribedChannels = await prisma.subscription.findMany({
    where: {
      subscriberId: subscriberId,
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
