import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from '../utils/cloudinary.js';
import { CloudinaryResponse } from '../types/cloudinary.types.js';
import prisma from '../lib/prisma.js';
import fs from 'fs';

// helper function
const removeLocalFile = (localPath: string) => {
  if (localPath && fs.existsSync(localPath)) {
    fs.unlinkSync(localPath);
  }
};

// exported functions
const publishAVideo = asyncHandler(async (req, res) => {
  // --- 1. AUTHENTICATION (Unchanged) ---
  // We strictly check for the ID. If middleware failed, we stop here.
  if (!req.user?.id) {
    throw new ApiError(401, 'Unauthorized');
  }

  // --- 2. INPUT EXTRACTION (Unchanged) ---
  const { title, description } = req.body;

  // Explicit casting for Multer files (TypeScript safety)
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const videoLocalPath = files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = files?.thumbnail?.[0]?.path;

  // --- 3. VALIDATION (Unchanged) ---
  // Fail fast. Don't upload to cloud if basic data is missing.
  if (!title || title.trim() === '') {
    if (videoLocalPath) removeLocalFile(videoLocalPath);
    if (thumbnailLocalPath) removeLocalFile(thumbnailLocalPath);
    throw new ApiError(400, 'Title is required');
  }
  if (!videoLocalPath) {
    throw new ApiError(400, 'Video file is required');
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, 'Thumbnail file is required');
  }

  // --- 4. PREPARE FOR ROLLBACK (Production Pattern) ---
  // We declare these outside the try-block so the catch-block can access them.
  let videoUpload: CloudinaryResponse | null = null;
  let thumbnailUpload: CloudinaryResponse | null = null;

  try {
    // --- 5. CLOUD UPLOADS (Unchanged) ---
    // This is the "Danger Zone". Network calls can fail.
    videoUpload = await uploadOnCloudinary(videoLocalPath);
    thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);

    // Atomic Check: We need BOTH. If one failed, the state is invalid.
    if (!videoUpload || !thumbnailUpload) {
      throw new ApiError(500, 'Failed to upload video or thumbnail');
    }

    // --- 6. DATABASE CREATION (The Migration Part) ---

    // OLD MONGOOSE CODE (Reference Only):
    /* const video = await Video.create({
      title,
      description,
      videoFile: { url: ..., public_id: ... }, // Nested object
      thumbnail: { url: ..., public_id: ... }, // Nested object
      owner: userId,
      duration: 0 // Placeholder
    });
    */

    // NEW PRISMA CODE (Production Grade):
    // - Flattens the structure (Postgres prefers columns over nested JSON)
    // - Uses 'userId' relation explicitly
    // - Captures real duration from Cloudinary (Better UX)
    const video = await prisma.video.create({
      data: {
        title,
        description: description || '',

        // Mapping flat columns
        videoFileUrl: videoUpload.url,
        videoFilePublicId: videoUpload.public_id,
        thumbnailUrl: thumbnailUpload.url,
        thumbnailPublicId: thumbnailUpload.public_id,

        // Data Integrity: Use real duration if available
        duration: videoUpload.duration || 0,

        isPublished: true,
        userId: req.user.id,
      },
    });

    // --- 7. SUCCESS RESPONSE (Unchanged) ---
    return res
      .status(201)
      .json(new ApiResponse(201, video, 'Video published successfully'));
  } catch (error) {
    // --- 8. THE ROLLBACK (Critical Production Logic) ---
    // If the Database crashes (e.g. Unique constraint, connection timeout),
    // we MUST delete the files we just uploaded.
    // Otherwise, you pay for storage of "ghost" files that no user can see.

    console.error('Video Publication Failed. Rolling back uploads...');

    // Safe Cleanup: Check if upload exists before trying to delete
    if (videoUpload?.public_id) {
      await deleteFromCloudinary(videoUpload.public_id);
    }
    if (thumbnailUpload?.public_id) {
      await deleteFromCloudinary(thumbnailUpload.public_id);
    }

    // Re-throw so the global error handler sends the 500 JSON to the user
    throw new ApiError(
      500,
      'Something went wrong while publishing the video. Files were deleted.'
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  // --- 1. EXTRACTION & VALIDATION ---
  const { videoId } = req.params;

  // PRISMA SPECIFIC: IDs are integers. We must parse them.
  // In Mongo, you verified isValidObjectId(videoId).
  // In Postgres, we verify it's a number.
  const videoIdInt = parseInt(videoId);
  if (isNaN(videoIdInt)) {
    throw new ApiError(400, 'Invalid video ID');
  }

  // --- 2. HANDLE WATCH HISTORY (The "Side Effect") ---
  // We do this BEFORE fetching the video. Even if the view count update fails,
  // or is slow, we try to record the history if the user is logged in.

  if (req.user?.id) {
    // OLD MONGOOSE CODE:
    /* await User.findByIdAndUpdate(req.user._id, { 
         $addToSet: { watchHistory: videoId } 
       }); 
    */

    // NEW PRISMA CODE:
    // We use 'upsert'.
    // - If history exists: Update 'watchedAt' to NOW.
    // - If new: Create new entry.
    // This replaces $addToSet logic perfectly.
    await prisma.watchHistory.upsert({
      where: {
        userId_videoId: {
          // This targets the @@unique constraint
          userId: req.user.id,
          videoId: videoIdInt,
        },
      },
      create: {
        userId: req.user.id,
        videoId: videoIdInt,
      },
      update: {
        watchedAt: new Date(),
      },
    });
  }

  // --- 3. FETCH VIDEO & INCREMENT VIEWS (Atomic Operation) ---

  // OLD MONGOOSE CODE:
  /* const video = await Video.findById(videoId);
     video.views += 1;
     await video.save();
  */

  // NEW PRISMA CODE:
  // We do fetch + update in ONE database call.
  // It is atomic, meaning two users clicking at once won't mess up the count.
  const video = await prisma.video.update({
    where: { id: videoIdInt },
    data: {
      views: { increment: 1 }, // Atomic increment
    },
    include: {
      user: {
        // Populate Owner Details
        select: {
          fullname: true,
          username: true,
          avatar: true,
          // Optimization: Count subscribers instead of fetching array
          _count: {
            select: { subscribers: true },
          },
        },
      },
    },
  });

  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  // --- 4. FORMAT RESPONSE ---
  // Flatten the structure slightly for the frontend if needed
  // (Optional, but cleaner)
  const responseData = {
    ...video,
    owner: {
      ...video.user,
      subscribersCount: video.user._count.subscribers,
    },
  };
  // @ts-expect-error - Cleanup internal prisma field
  delete responseData.user._count;

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, 'Video fetched successfully'));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  // 1. Validation (ID Check)
  const videoIdInt = parseInt(videoId);
  if (isNaN(videoIdInt)) throw new ApiError(400, 'Invalid video ID');

  // 2. Auth Check (Basic)
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');

  // 3. Authorization (Ownership Check)
  // We must fetch the video first to see who owns it.
  const video = await prisma.video.findUnique({
    where: { id: videoIdInt },
  });

  if (!video) throw new ApiError(404, 'Video not found');

  // STRICT CHECK: Does the logged-in user own this video?
  if (video.userId !== req.user.id) {
    throw new ApiError(403, 'You are not authorized to update this video');
  }

  // 4. Handle Thumbnail Upload (If provided)
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const thumbnailLocalPath = files?.thumbnail?.[0]?.path;

  let thumbnailUpload: CloudinaryResponse | null = null;

  try {
    // If user sent a new file, upload it first
    if (thumbnailLocalPath) {
      thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);
      if (!thumbnailUpload)
        throw new ApiError(500, 'Failed to upload new thumbnail');
    }

    // 5. Database Update (Prisma)
    // We only update fields that were actually sent.
    const updatedVideo = await prisma.video.update({
      where: { id: videoIdInt },
      data: {
        title: title || undefined, // undefined tells Prisma "don't touch this"
        description: description || undefined,

        // Only update thumbnail if we uploaded a new one
        thumbnailUrl: thumbnailUpload?.url || undefined,
        thumbnailPublicId: thumbnailUpload?.public_id || undefined,
      },
    });

    // 6. Cleanup OLD Thumbnail (The Swap)
    // If DB update succeeded AND we uploaded a new thumbnail, delete the OLD one.
    if (thumbnailUpload && video.thumbnailPublicId) {
      // We don't await this because we don't want to block the response.
      // Fire and forget (or log error if it fails).
      deleteFromCloudinary(video.thumbnailPublicId).catch((err) =>
        console.error('Failed to delete old thumbnail', err)
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, 'Video updated successfully'));
  } catch (error) {
    // 7. Rollback (Critical)
    // If the DB update failed, but we just uploaded a NEW thumbnail,
    // we must delete that NEW thumbnail because it is now "orphan" (unused).
    if (thumbnailUpload?.public_id) {
      await deleteFromCloudinary(thumbnailUpload.public_id);
    }

    throw error; // Let global handler send the 500
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // 1. Validation (ID Check)
  const videoIdInt = parseInt(videoId);
  if (isNaN(videoIdInt)) throw new ApiError(400, 'Invalid video ID');

  // 2. Auth Check
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');

  // 3. Authorization & Fetch
  // We MUST fetch first to get the public_ids for Cloudinary cleanup
  const video = await prisma.video.findUnique({
    where: { id: videoIdInt },
  });

  if (!video) throw new ApiError(404, 'Video not found');

  // STRICT CHECK: Ownership
  if (video.userId !== req.user.id) {
    throw new ApiError(403, 'You are not authorized to delete this video');
  }

  // 4. Database Delete (Prisma)
  // We delete from DB *before* Cloudinary.
  // Why? If DB delete fails, we shouldn't touch the files.
  await prisma.video.delete({
    where: { id: videoIdInt },
  });

  // 5. Cloudinary Cleanup (Background Task)
  // We don't await this blocking the user response.
  // We let it run in the background.

  const cleanupFiles = async () => {
    try {
      if (video.videoFilePublicId) {
        await deleteFromCloudinary(video.videoFilePublicId);
      }
      if (video.thumbnailPublicId) {
        await deleteFromCloudinary(video.thumbnailPublicId);
      }
    } catch (error) {
      console.error('Failed to delete files from Cloudinary:', error);
      // In a real startup, you would log this to Sentry/Datadog here
    }
  };
  cleanupFiles(); // Fire and forget

  // 6. Response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Video deleted successfully'));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const videoIdInt = parseInt(videoId);
  if (isNaN(videoIdInt)) throw new ApiError(400, 'Invalid video ID');

  // 1. Find the video
  const video = await prisma.video.findUnique({
    where: { id: videoIdInt },
  });

  if (!video) throw new ApiError(404, 'Video not found');

  // 2. Check Ownership
  if (video.userId !== req.user?.id) {
    throw new ApiError(403, 'Unauthorized');
  }

  // 3. Toggle & Update
  const updatedVideo = await prisma.video.update({
    where: { id: videoIdInt },
    data: {
      isPublished: !video.isPublished, // Flip the boolean
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, 'Video publish status toggled'));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { query, sortBy, sortType, userId } = req.query;

  // --- 1. BUILD SEARCH FILTERS ---
  const whereCondition: any = {
    isPublished: true, // Default: only show published videos
  };

  // Search Logic (Title OR Description)
  if (query) {
    whereCondition.OR = [
      { title: { contains: query as string, mode: 'insensitive' } },
      { description: { contains: query as string, mode: 'insensitive' } },
    ];
  }

  // User Filter Logic
  if (userId) {
    whereCondition.userId = parseInt(userId as string);
  }

  // --- 2. PAGINATION MATH ---
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // --- 3. FETCH VIDEOS ---
  const videos = await prisma.video.findMany({
    where: whereCondition,
    orderBy: {
      [(sortBy as string) || 'createdAt']: sortType === 'asc' ? 'asc' : 'desc',
    },
    skip: skip,
    take: limit,
    include: {
      user: {
        select: { fullname: true, username: true, avatar: true },
      },
    },
  });

  // --- 4. FETCH TOTAL COUNT (For Frontend UI) ---
  const totalDocs = await prisma.video.count({ where: whereCondition });
  const totalPages = Math.ceil(totalDocs / limit);

  // --- 5. RESPONSE ---
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

// 6 exports
export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
