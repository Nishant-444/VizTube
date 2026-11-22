import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from '../utils/cloudinary.js';
import { CloudinaryResponse } from '../types/cloudinary.types.js';
import { prisma } from '../lib/prisma.js';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { Request } from 'express';
import { Prisma } from '../generated/client/client.js';
import { getSingleParam } from '../utils/normalize.js';
import { ProcessingStatus } from '../generated/client/enums.js';
import { enqueueIngest } from '../jobs/ingest.job.js';

const projectTempDir = path.resolve(process.cwd(), 'public', 'temp');
const containerTempDir = path.resolve('/app', 'public', 'temp');

const isTempPath = (targetPath: string) => {
  const resolved = path.resolve(targetPath);
  return (
    resolved.startsWith(`${projectTempDir}${path.sep}`) ||
    resolved.startsWith(`${containerTempDir}${path.sep}`)
  );
};

// helper function
const removeLocalFile = (localPath: string) => {
  if (!localPath || !isTempPath(localPath)) {
    return;
  }

  try {
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EACCES') {
      console.error(
        `EACCES: Permission denied deleting file ${localPath}`,
        error
      );
      return;
    }
    throw error;
  }
};

// exported functions
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user?.id;
  
  if (!userId) throw new ApiError(401, 'Unauthorized');
  if (!title) throw new ApiError(400, 'Title is required');

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const videoLocalPath = files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = files?.thumbnail?.[0]?.path;

  if (!videoLocalPath) throw new ApiError(400, 'Video file is required');
  if (!thumbnailLocalPath) {
    fs.unlinkSync(videoLocalPath);
    throw new ApiError(400, 'Thumbnail is required');
  }

  let videoRecordId: string | null = null;

  try {
    const [videoUpload, thumbnailUpload] = await Promise.all([
      uploadOnCloudinary(videoLocalPath),
      uploadOnCloudinary(thumbnailLocalPath),
    ]);

    if (!videoUpload || !thumbnailUpload) {
      throw new ApiError(500, 'Failed to upload files to cloud storage');
    }

    const videoRecord = await prisma.video.create({
      data: {
        title,
        description: description || '',
        videoFileUrl: videoUpload.url,
        videoFilePublicId: videoUpload.public_id,
        thumbnailUrl: thumbnailUpload.url,
        thumbnailPublicId: thumbnailUpload.public_id,
        duration: videoUpload.duration || 0,
        processingStatus: ProcessingStatus.PROCESSING,
        isPublished: true,
        userId: userId,
      },
    });

    videoRecordId = videoRecord.id;

    // the job pulls the audio from Cloudinary, so the local file isn't needed after this
    let video = videoRecord;
    let message = 'Video published successfully. AI processing has been queued.';
    try {
      await enqueueIngest(videoRecord.id);
    } catch (err) {
      // the video itself is published; the owner can retry AI processing later
      console.error('Failed to queue AI ingestion:', err);
      video = await prisma.video.update({
        where: { id: videoRecord.id },
        data: { processingStatus: ProcessingStatus.FAILED },
      });
      message =
        'Video published, but AI processing could not be queued. Use reprocess to retry.';
    }

    return res.status(200).json(new ApiResponse(200, { video }, message));
  } catch (error: any) {
    if (videoRecordId) {
      await prisma.video
        .update({
          where: { id: videoRecordId },
          data: { processingStatus: ProcessingStatus.FAILED },
        })
        .catch((e) => console.error('Failed to update status', e));
    }
    throw new ApiError(500, error?.message || 'Error publishing video');
  } finally {
    removeLocalFile(videoLocalPath);
    removeLocalFile(thumbnailLocalPath);
  }
});

// public; views are counted separately by recordView
const getVideoById = asyncHandler(async (req, res) => {
  const videoId = getSingleParam(req.params.videoId);

  if (!videoId) throw new ApiError(400, 'Invalid video ID');

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      user: {
        select: {
          id: true,
          fullname: true,
          username: true,
          avatar: true,
          _count: {
            select: { subscribers: true },
          },
        },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  // unpublished videos are only visible to their owner
  if (!video || (!video.isPublished && video.userId !== req.user?.id)) {
    throw new ApiError(404, 'Video not found');
  }

  if (req.user?.id) {
    await prisma.watchHistory.upsert({
      where: {
        userId_videoId: {
          userId: req.user.id,
          videoId: videoId,
        },
      },
      create: {
        userId: req.user.id,
        videoId: videoId,
      },
      update: {
        watchedAt: new Date(),
      },
    });
  }

  // viewer-specific state for the like and subscribe buttons
  const viewerId = req.user?.id;
  const [like, subscription] = viewerId
    ? await Promise.all([
        prisma.like.findUnique({
          where: { userId_videoId: { userId: viewerId, videoId } },
          select: { id: true },
        }),
        prisma.subscription.findUnique({
          where: {
            subscriberId_channelId: {
              subscriberId: viewerId,
              channelId: video.userId,
            },
          },
          select: { id: true },
        }),
      ])
    : [null, null];

  const { _count: userCount, ...restOfUser } = video.user;
  const { _count: videoCount, ...videoData } = video;

  const responseData = {
    ...videoData,
    likesCount: videoCount.likes,
    commentsCount: videoCount.comments,
    isLiked: !!like,
    user: {
      ...restOfUser,
      subscribersCount: userCount.subscribers,
      isSubscribed: !!subscription,
    },
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, 'Video fetched successfully'));
});

// identifies a viewer for view de-duplication without storing raw IPs
const getViewerKey = (req: Request) => {
  if (req.user?.id) return `user:${req.user.id}`;
  const fingerprint = `${req.ip ?? ''}|${req.get('user-agent') ?? ''}`;
  return `anon:${createHash('sha256').update(fingerprint).digest('hex')}`;
};

// called by the player after ~10s of playback; counts once per viewer per day
const recordView = asyncHandler(async (req, res) => {
  const videoId = getSingleParam(req.params.videoId);
  if (!videoId) throw new ApiError(400, 'Invalid video ID');

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { userId: true, isPublished: true },
  });
  if (!video || (!video.isPublished && video.userId !== req.user?.id)) {
    throw new ApiError(404, 'Video not found');
  }

  const now = new Date();
  const day = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const result = await prisma.$transaction(async (tx) => {
    const { count } = await tx.videoView.createMany({
      data: [{ videoId, viewerKey: getViewerKey(req), day }],
      skipDuplicates: true,
    });

    const updated = count
      ? await tx.video.update({
          where: { id: videoId },
          data: { views: { increment: 1 } },
          select: { views: true },
        })
      : await tx.video.findUniqueOrThrow({
          where: { id: videoId },
          select: { views: true },
        });

    return { counted: count > 0, views: updated.views };
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        result.counted ? 'View recorded' : 'View already counted today'
      )
    );
});

// newest videos from channels the user subscribes to, cursor-paginated
const getSubscriptionFeed = asyncHandler(async (req, res) => {
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const cursor = getSingleParam(req.query.cursor as string | undefined);

  const subscriptions = await prisma.subscription.findMany({
    where: { subscriberId: req.user.id },
    select: { channelId: true },
  });
  const channelIds = subscriptions.map((s) => s.channelId);

  if (!channelIds.length) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { items: [], nextCursor: null }, 'Feed fetched')
      );
  }

  // fetch one extra row to know whether another page exists
  const videos = await prisma.video.findMany({
    where: { userId: { in: channelIds }, isPublished: true },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: { select: { fullname: true, username: true, avatar: true } },
    },
  });

  const hasMore = videos.length > limit;
  const items = hasMore ? videos.slice(0, limit) : videos;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items,
        nextCursor: hasMore ? items[items.length - 1].id : null,
      },
      'Feed fetched'
    )
  );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoId = getSingleParam(req.params.videoId);

  if (!videoId) {
    throw new ApiError(400, 'Invalid or missing video ID');
  }
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');

  const video = await prisma.video.findUnique({
    where: { id: videoId },
  });

  if (!video) throw new ApiError(404, 'Video not found');

  if (video.userId !== req.user.id) {
    throw new ApiError(403, 'You are not authorized to update this video');
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const thumbnailLocalPath = files?.thumbnail?.[0]?.path;

  let thumbnailUpload: CloudinaryResponse | null = null;

  try {
    if (thumbnailLocalPath) {
      thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);
      if (!thumbnailUpload)
        throw new ApiError(500, 'Failed to upload new thumbnail');
    }

    const updatedVideo = await prisma.video.update({
      where: { id: videoId },
      data: {
        title: title || undefined,
        description: description || undefined,

        thumbnailUrl: thumbnailUpload?.url || undefined,
        thumbnailPublicId: thumbnailUpload?.public_id || undefined,
      },
    });

    if (thumbnailUpload && video.thumbnailPublicId) {
      deleteFromCloudinary(video.thumbnailPublicId).catch((err) =>
        console.error('Failed to delete old thumbnail', err)
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, 'Video updated successfully'));
  } catch (error) {
    if (thumbnailUpload?.public_id) {
      await deleteFromCloudinary(thumbnailUpload.public_id);
    }

    throw error;
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const videoId = getSingleParam(req.params.videoId);

  if (!videoId) {
    throw new ApiError(400, 'Invalid or missing video ID');
  }
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');

  const video = await prisma.video.findUnique({
    where: { id: videoId },
  });

  if (!video) throw new ApiError(404, 'Video not found');

  if (video.userId !== req.user.id) {
    throw new ApiError(403, 'You are not authorized to delete this video');
  }

  await prisma.video.delete({
    where: { id: videoId },
  });

  const cleanupFiles = async () => {
    try {
      if (video.videoFilePublicId) {
        await deleteFromCloudinary(video.videoFilePublicId, 'video');
      }
      if (video.thumbnailPublicId) {
        await deleteFromCloudinary(video.thumbnailPublicId);
      }
    } catch (error) {
      console.error('Failed to delete files from Cloudinary:', error);
    }
  };
  await cleanupFiles();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Video deleted successfully'));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const videoId = getSingleParam(req.params.videoId);

  if (!videoId) {
    throw new ApiError(400, 'Invalid or missing video ID');
  }
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');

  const video = await prisma.video.findUnique({
    where: { id: videoId },
  });

  if (!video) throw new ApiError(404, 'Video not found');

  if (video.userId !== req.user?.id) {
    throw new ApiError(403, 'Unauthorized');
  }

  const updatedVideo = await prisma.video.update({
    where: { id: videoId },
    data: {
      isPublished: !video.isPublished,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, 'Video publish status toggled'));
});

// safe ORDER BY targets; never interpolate user input into SQL directly
const SORT_COLUMNS = {
  createdAt: Prisma.raw('v."createdAt"'),
  views: Prisma.raw('v."views"'),
  duration: Prisma.raw('v."duration"'),
} as const;
type SortColumn = keyof typeof SORT_COLUMNS;

const isSortColumn = (value: unknown): value is SortColumn =>
  typeof value === 'string' && value in SORT_COLUMNS;

// must match the expression of the "Video_search_idx" GIN index
const SEARCH_VECTOR = Prisma.sql`(setweight(to_tsvector('english', v."title"), 'A') || setweight(to_tsvector('english', coalesce(v."description", '')), 'B'))`;

// public; full-text search with `query`, owner sees their own unpublished videos
const getAllVideos = asyncHandler(async (req, res) => {
  const query = getSingleParam(req.query.query as string | undefined)?.trim();
  const userId = getSingleParam(req.query.userId as string | undefined);
  const sortBy = req.query.sortBy;
  const direction = req.query.sortType === 'asc' ? 'asc' : 'desc';

  if (sortBy !== undefined && sortBy !== 'relevance' && !isSortColumn(sortBy)) {
    throw new ApiError(
      400,
      'sortBy must be one of: relevance, createdAt, views, duration'
    );
  }

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const includeUnpublished = !!userId && userId === req.user?.id;
  const userInclude = {
    user: { select: { fullname: true, username: true, avatar: true } },
  };

  let videos;
  let totalDocs: number;

  if (query) {
    const tsQuery = Prisma.sql`websearch_to_tsquery('english', ${query})`;
    const filters = [Prisma.sql`${SEARCH_VECTOR} @@ ${tsQuery}`];
    if (!includeUnpublished) filters.push(Prisma.sql`v."isPublished" = true`);
    if (userId) filters.push(Prisma.sql`v."userId" = ${userId}`);
    const where = Prisma.join(filters, ' AND ');

    // relevance by default; an explicit sortBy column overrides it
    const orderBy = isSortColumn(sortBy)
      ? Prisma.sql`${SORT_COLUMNS[sortBy]} ${Prisma.raw(direction.toUpperCase())}, v."id" DESC`
      : Prisma.sql`ts_rank(${SEARCH_VECTOR}, ${tsQuery}) DESC, v."createdAt" DESC`;

    const [rows, countRows] = await Promise.all([
      prisma.$queryRaw<{ id: string }[]>`
        SELECT v."id" FROM "Video" v
        WHERE ${where}
        ORDER BY ${orderBy}
        LIMIT ${limit} OFFSET ${skip}`,
      prisma.$queryRaw<{ count: number }[]>`
        SELECT count(*)::int AS count FROM "Video" v WHERE ${where}`,
    ]);

    // fetch full records, then restore the ranked order
    const ids = rows.map((r) => r.id);
    const found = await prisma.video.findMany({
      where: { id: { in: ids } },
      include: userInclude,
    });
    const byId = new Map(found.map((v) => [v.id, v]));
    videos = ids.map((id) => byId.get(id)).filter((v) => v !== undefined);
    totalDocs = countRows[0]?.count ?? 0;
  } else {
    const where: Prisma.VideoWhereInput = {
      ...(includeUnpublished ? {} : { isPublished: true }),
      ...(userId ? { userId } : {}),
    };
    const column: SortColumn = isSortColumn(sortBy) ? sortBy : 'createdAt';

    [videos, totalDocs] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy: [{ [column]: direction }, { id: 'desc' }],
        skip,
        take: limit,
        include: userInclude,
      }),
      prisma.video.count({ where }),
    ]);
  }

  const totalPages = Math.ceil(totalDocs / limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        docs: videos,
        totalDocs,
        limit,
        page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      'Videos fetched successfully'
    )
  );
});

// AI processing state, polled by the UI while a video is PROCESSING
const getVideoStatus = asyncHandler(async (req, res) => {
  const videoId = getSingleParam(req.params.videoId);
  if (!videoId) throw new ApiError(400, 'Invalid or missing video ID');

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      userId: true,
      isPublished: true,
      processingStatus: true,
      hasTranscript: true,
      allowPublicQnA: true,
    },
  });

  // unpublished videos are only visible to their owner
  if (!video || (!video.isPublished && video.userId !== req.user?.id)) {
    throw new ApiError(404, 'Video not found');
  }

  const { userId, isPublished, ...status } = video;

  return res
    .status(200)
    .json(new ApiResponse(200, status, 'Video status fetched successfully'));
});

// owner-only: queue AI processing again for a video that failed
const reprocessVideo = asyncHandler(async (req, res) => {
  const videoId = getSingleParam(req.params.videoId);
  if (!videoId) throw new ApiError(400, 'Invalid or missing video ID');
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: { userId: true, processingStatus: true },
  });

  if (!video) throw new ApiError(404, 'Video not found');
  if (video.userId !== req.user.id) {
    throw new ApiError(403, 'You are not authorized to reprocess this video');
  }
  if (video.processingStatus !== ProcessingStatus.FAILED) {
    throw new ApiError(
      409,
      `Only failed videos can be reprocessed. Current status: ${video.processingStatus}`
    );
  }

  const updated = await prisma.video.update({
    where: { id: videoId },
    data: {
      processingStatus: ProcessingStatus.PROCESSING,
      hasTranscript: false,
      allowPublicQnA: false,
    },
    select: {
      id: true,
      processingStatus: true,
      hasTranscript: true,
      allowPublicQnA: true,
    },
  });

  try {
    await enqueueIngest(videoId);
  } catch (error) {
    await prisma.video.update({
      where: { id: videoId },
      data: { processingStatus: ProcessingStatus.FAILED },
    });
    throw new ApiError(503, 'Could not queue AI processing, try again later');
  }

  return res
    .status(202)
    .json(new ApiResponse(202, updated, 'AI processing has been queued'));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  getVideoStatus,
  reprocessVideo,
  recordView,
  getSubscriptionFeed,
};
