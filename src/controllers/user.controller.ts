import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { cookieOptions } from '../config/cookieOptions.js';
import mongoose from 'mongoose';
import { CloudinaryResponse } from '../types/cloudinary.types.js';

// only a helper function
const generateAccessAndRefreshToken = async (userId: string) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not Found!');
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      'Something went wrong while generating access and refresh tokens'
    );
  }
};

// to be exported functions
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;
  const { avatar, coverImage } = req.files as {
    avatar?: Express.Multer.File[];
    coverImage?: Express.Multer.File[];
  };

  // check if user exist already
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, 'User with email or username already exists');
  }

  if (!avatar?.[0]?.path) {
    throw new ApiError(400, 'Avatar file is required');
  }
  const avatarLocalPath = avatar?.[0]?.path;

  if (!coverImage?.[0]?.path) {
    throw new ApiError(400, 'Cover Image file is required');
  }
  const coverLocalPath = coverImage?.[0]?.path;

  let avatarUpload: CloudinaryResponse | null = null;
  try {
    avatarUpload = await uploadOnCloudinary(avatarLocalPath);
    console.log('Uploaded Avatar', avatarUpload);
  } catch (error) {
    console.log('Error uploading avatar', error);
    throw new ApiError(500, 'Failed to upload avatar');
  }

  let coverImageUpload: CloudinaryResponse | null = null;
  try {
    coverImageUpload = await uploadOnCloudinary(coverLocalPath);
    console.log('Uploaded cover image', coverImageUpload);
  } catch (error) {
    console.log('Error uploading cover image', error);
    throw new ApiError(500, 'Failed to upload cover image');
  }

  try {
    const user = await User.create({
      fullname,
      avatar: avatarUpload?.url,
      coverImage: coverImageUpload?.url || '',
      email,
      password,
      username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
      '-password -refreshToken'
    );

    if (!createdUser) {
      throw new ApiError(500, 'Something went wrong while registering a user');
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, 'User registered successfully!'));
  } catch (error) {
    console.log('User creation failed');
    if (avatarUpload) {
      await deleteFromCloudinary(avatarUpload.public_id);
    }
    if (coverImageUpload) {
      await deleteFromCloudinary(coverImageUpload.public_id);
    }

    throw new ApiError(
      500,
      'Something went wrong while registering a user and images were deleted'
    );
  }
});

const loginUser = asyncHandler(async function (req, res) {
  const { email, username, password } = req.body;

  // finding user
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, 'User not Found!');
  }

  // check the password
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Password incorrect');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        'User logged in successfully'
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized - no user in request');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(200, {}, 'User logged out successfully'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    ) as JwtPayload;

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie('accessToken', accessToken, cookieOptions)
      .cookie('refreshToken', newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          'Access token refreshed successfully'
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      'Something went wrong while refreshing access token'
    );
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (oldPassword === newPassword) {
    throw new ApiError(
      400,
      'New password cannot be the same as the old password'
    );
  }

  const user = await User.findById(req.user?._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Old password is incorrect');
  }

  user.password = newPassword;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Password changed successfully'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, 'Current user details'));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email, username } = req.body;
  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized - no user in request');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullname,
        email: email,
        username,
      },
    },
    {
      new: true,
    }
  ).select('-password -refreshToken');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Account details updated successfully'));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // TODO: Delete old avatar from Cloudinary
  // Will implement properly in Postgres migration with separate avatarPublicId field
  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { avatar } = req.files as {
    avatar?: Express.Multer.File[];
  };

  if (!avatar?.[0]?.path) {
    throw new ApiError(400, 'Avatar file is required');
  }
  const avatarLocalPath = avatar[0].path;

  let avatarUpload: CloudinaryResponse | null = null;
  avatarUpload = await uploadOnCloudinary(avatarLocalPath);

  if (!avatarUpload) {
    throw new ApiError(500, 'Something went wrong while uploading avatar');
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatarUpload.url,
      },
    },
    { new: true }
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Avatar updated successfully'));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  // TODO: Delete old coverImage from Cloudinary
  // Will implement properly in Postgres migration with separate PublicId field
  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { coverImage } = req.files as {
    coverImage?: Express.Multer.File[];
  };

  if (!coverImage?.[0]?.path) {
    throw new ApiError(400, 'Cover Image file is required');
  }
  const coverImageLocalPath = coverImage[0].path;

  let coverImageUpload: CloudinaryResponse | null = null;
  coverImageUpload = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImageUpload) {
    throw new ApiError(500, 'Something went wrong while uploading cover image');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImageUpload.url,
      },
    },
    { new: true }
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Cover image updated successfully'));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const channel = await User.aggregate([
    {
      $match: {
        username: username,
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'subscribers',
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'subscriber',
        as: 'subscribedTo',
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: '$subscribers',
        },
        channelsSubscribedToCount: {
          $size: '$subscribedTo',
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, '$subscribers.subscriber'],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      // project only necessary data
      $project: {
        fullname: 1,
        username: 1,
        email: 1,
        avatar: 1,
        subscriberCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channel.length) {
    throw new ApiError(404, 'Channel not found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], 'Channel profile fetched successfully')
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: req.user?._id,
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'watchHistory',
        foreignField: '_id',
        as: 'watchHistory',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: '$owner',
              },
            },
          },
        ],
      },
    },
  ]);

  if (!user.length || !user[0].watchHistory.length) {
    throw new ApiError(404, 'No watch history found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        'Watch history fetched successfully'
      )
    );
});

// 11 exports
export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
