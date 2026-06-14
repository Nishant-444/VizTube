import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { prisma } from '../lib/prisma.js';
import { getSingleParam } from '../utils/normalize.js';

const createPlaylist = asyncHandler(async (req, res) => {
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');
  const userId = req.user.id;

  const { name, description } = req.body;

  if (!name || name.trim() === '') {
    throw new ApiError(400, 'Playlist name is required');
  }

  const playlist = await prisma.playlist.create({
    data: {
      name,
      description: description || '',
      userId: userId, // Direct relation to User
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, 'Playlist created successfully'));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const userId = getSingleParam(req.params.userId);

  if (!userId) throw new ApiError(400, 'Invalid user ID');

  const playlists = await prisma.playlist.findMany({
    where: {
      userId: userId,
    },
    include: {
      videos: {
        take: 1,
        select: {
          video: {
            select: {
              videoFileUrl: true,
              thumbnailUrl: true,
            },
          },
        },
      },
      _count: {
        select: { videos: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const formattedPlaylists = playlists.map((playlist: any) => ({
    ...playlist,
    totalVideos: playlist._count.videos,
    thumbnail: playlist.videos[0]?.video?.thumbnailUrl || null,
    videos: undefined,
    _count: undefined,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        formattedPlaylists,
        'User playlists fetched successfully'
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const playlistId = getSingleParam(req.params.playlistId);

  if (!playlistId) throw new ApiError(400, 'Invalid playlist ID');

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: {
      user: {
        select: {
          username: true,
          fullname: true,
          avatar: true,
        },
      },
      videos: {
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
      },
    },
  });

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found');
  }

  const videos = playlist.videos.map((item: any) => item.video);

  const totalViews = videos.reduce((sum: any, v: any) => sum + v.views, 0);

  const responseData = {
    ...playlist,
    videos: videos,
    totalVideos: playlist.videos.length,
    totalViews: totalViews,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, 'Playlist fetched successfully'));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const playlistId = getSingleParam(req.params.playlistId);
  const videoId = getSingleParam(req.params.videoId);

  if (!playlistId || !videoId) {
    throw new ApiError(400, 'Invalid IDs');
  }

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
  });

  if (!playlist) throw new ApiError(404, 'Playlist not found');

  if (playlist.userId !== req.user?.id) {
    throw new ApiError(403, 'You are not authorized to edit this playlist');
  }

  try {
    const updatedPlaylist = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        videos: {
          create: { videoId: videoId },
        },
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, updatedPlaylist, 'Video added to playlist'));
  } catch (error) {
    throw new ApiError(404, 'Video not found or could not be added');
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const playlistId = getSingleParam(req.params.playlistId);
  const videoId = getSingleParam(req.params.videoId);

  if (!playlistId || !videoId) throw new ApiError(400, 'Invalid IDs');

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: { videos: { select: { id: true } } },
  });

  if (!playlist) throw new ApiError(404, 'Playlist not found');

  if (playlist.userId !== req.user?.id) {
    throw new ApiError(403, 'You are not authorized to edit this playlist');
  }

  await prisma.playlistVideo.deleteMany({
    where: {
      playlistId: playlistId,
      videoId: videoId,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Video removed from playlist'));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const playlistId = getSingleParam(req.params.playlistId);
  if (!playlistId) {
    throw new ApiError(404, 'Playlist not found');
  }

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
  });

  if (!playlist) throw new ApiError(404, 'Playlist not found');

  if (playlist.userId !== req.user?.id) {
    throw new ApiError(403, 'You are not authorized to delete this playlist');
  }

  await prisma.playlist.delete({
    where: { id: playlistId },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Playlist deleted successfully'));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const playlistId = getSingleParam(req.params.playlistId);
  const { name, description } = req.body;
  if (!playlistId) {
    throw new ApiError(404, 'Playlist not found.');
  }

  if (!name || name.trim() === '') {
    throw new ApiError(400, 'Name is required for update');
  }

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
  });

  if (!playlist) throw new ApiError(404, 'Playlist not found');

  if (playlist.userId !== req.user?.id) {
    throw new ApiError(403, 'You are not authorized to update this playlist');
  }

  const updatedPlaylist = await prisma.playlist.update({
    where: { id: playlistId },
    data: {
      name,
      description: description || '',
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, 'Playlist updated successfully')
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
