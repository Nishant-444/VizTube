import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import prisma from '../lib/prisma.js';

const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [totalViewsResult, totalSubscribers, totalVideos, totalLikes] =
    await Promise.all([
      prisma.video.aggregate({
        where: {
          userId: userId,
        },
        _sum: {
          views: true,
        },
      }),
      prisma.subscription.count({
        where: {
          channelId: userId,
        },
      }),
      prisma.video.count({
        where: {
          userId: userId,
        },
      }),
      prisma.like.count({
        where: {
          video: {
            userId: userId,
          },
        },
      }),
    ]);

  const stats = {
    totalViews: totalViewsResult._sum.views || 0,
    totalSubscribers,
    totalVideos,
    totalLikes,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, 'Channel stats fetched successfully'));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const videos = await prisma.video.findMany({
    where: {
      userId: userId,
    },
    include: {
      _count: {
        select: {
          likes: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: skip,
    take: limit,
  });

  const totalVideos = await prisma.video.count({ where: { userId } });

  return res
    .status(200)
    .json(new ApiResponse(200, { videos, totalVideos }, 'Videos fetched'));
});

export { getChannelStats, getChannelVideos };
