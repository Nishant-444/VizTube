import mongoose from 'mongoose';
import { Playlist } from '../models/playlist.model.js';
import { Video } from '../models/video.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim() === '') {
    throw new ApiError(400, 'Playlist name is required');
  }

  const playlist = await Playlist.create({
    name,
    description: description || '',
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(500, 'Failed to create playlist');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, 'Playlist created successfully'));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'videos',
        foreignField: '_id',
        as: 'playlistVideos',
      },
    },
    {
      $addFields: {
        totalVideos: { $size: '$playlistVideos' },
        thumbnail: { $first: '$playlistVideos.thumbnail' },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        totalVideos: 1,
        thumbnail: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, 'User playlists fetched successfully')
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'videos',
        foreignField: '_id',
        as: 'playlistVideos',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'videoOwnerDetails',
              pipeline: [
                {
                  $project: { username: 1, fullName: 1, avatar: 1 },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $first: '$videoOwnerDetails' },
            },
          },
          {
            $project: {
              videoOwnerDetails: 0,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'playlistOwner',
        pipeline: [
          {
            $project: { username: 1, fullName: 1, avatar: 1 },
          },
        ],
      },
    },
    {
      $addFields: {
        totalVideos: { $size: '$playlistVideos' },
        totalViews: { $sum: '$playlistVideos.views' },
        owner: { $first: '$playlistOwner' },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        owner: 1,
        totalVideos: 1,
        totalViews: 1,
        playlistVideos: 1,
        playlistOwner: 0,
      },
    },
  ]);

  if (!playlist || playlist.length === 0) {
    throw new ApiError(404, 'Playlist not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], 'Playlist fetched successfully'));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, 'Playlist not found');
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, 'You are not authorized to edit this playlist');
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: { videos: videoId },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, 'Failed to add video to playlist');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, 'Video added to playlist'));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, 'Playlist not found');
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, 'You are not authorized to edit this playlist');
  }

  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(404, 'Video not found in this playlist');
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, 'Failed to remove video from playlist');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, 'Video removed from playlist'));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, 'Playlist not found');
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this playlist');
  }

  await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Playlist deleted successfully'));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!name || name.trim() === '') {
    throw new ApiError(400, 'Name is required for update');
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, 'Playlist not found');
  }

  if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this playlist');
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description: description || '',
      },
    },
    { new: true }
  );

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
