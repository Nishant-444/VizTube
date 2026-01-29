import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from '../utils/cloudinary.js';
import { cookieOptions } from '../config/cookieOptions.js';
import fs from 'fs';

import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../utils/tokens.js';
import { prisma } from '../lib/prisma.js';

// internal functions

const getSafeUser = (user: any) => {
  const { password, refreshToken, ...safeUser } = user;
  return safeUser;
};

const generateAccessAndRefreshToken = async (userId: number) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'User not Found!');

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });
    const refreshToken = generateRefreshToken(user.id);

    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, 'Something went wrong while generating tokens');
  }
};

// exported function

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;

  // Validation
  if (
    [fullname, email, username, password].some((field) => field?.trim() === '')
  ) {
    throw new ApiError(400, 'All fields are required');
  }

  // Conflict Check
  const existingUser = await prisma.user.findFirst({
    // findfirst - give the first match you find
    where: { OR: [{ username }, { email }] },
  });

  if (existingUser) {
    throw new ApiError(409, 'User with email or username already exists');
  }

  // File Uploads
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const avatarLocalPath = files?.avatar?.[0]?.path;
  const coverLocalPath = files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) throw new ApiError(400, 'Avatar file is required');

  let avatarUpload, coverImageUpload;

  try {
    avatarUpload = await uploadOnCloudinary(avatarLocalPath);
    fs.unlinkSync(avatarLocalPath);
    if (coverLocalPath) {
      coverImageUpload = await uploadOnCloudinary(coverLocalPath);
    }
    fs.unlinkSync(coverLocalPath);
  } catch (error) {
    throw new ApiError(500, 'Failed to upload images');
  }

  try {
    // Create User
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullname,
        email,
        password: hashedPassword,
        username: username.toLowerCase(),
        avatar: avatarUpload?.url || '',
        coverImage: coverImageUpload?.url || '',
      },
    });

    return res
      .status(201)
      .json(
        new ApiResponse(200, getSafeUser(user), 'User registered successfully!')
      );
  } catch (error) {
    // Rollback Cloudinary on DB Failure
    if (avatarUpload?.public_id)
      await deleteFromCloudinary(avatarUpload.public_id);
    if (coverImageUpload?.public_id)
      await deleteFromCloudinary(coverImageUpload.public_id);
    throw new ApiError(500, 'User registration failed, cleanup performed');
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email)
    throw new ApiError(400, 'Username or email required');

  const user = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (!user) throw new ApiError(404, 'User not Found!');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new ApiError(401, 'Invalid credentials');

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user.id
  );

  return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: getSafeUser(user), accessToken, refreshToken },
        'User logged in successfully'
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');

  await prisma.user.update({
    where: { id: req.user.id },
    data: { refreshToken: null },
  });

  return res
    .status(200)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(200, {}, 'User logged out successfully'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken)
    throw new ApiError(401, 'Refresh token is required');

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
    });

    if (!user || user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user.id);

    return res
      .status(200)
      .cookie('accessToken', accessToken, cookieOptions)
      .cookie('refreshToken', newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          'Access token refreshed'
        )
      );
  } catch (error) {
    throw new ApiError(401, 'Invalid refresh token');
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new ApiError(404, 'User not found');

  const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordCorrect) throw new ApiError(400, 'Invalid old password');

  const newHashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: newHashedPassword },
  });

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
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { fullname, email, username },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, getSafeUser(user), 'Account updated successfully')
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  // console.log(files);

  const avatarLocalPath = files?.avatar?.[0]?.path;
  // console.log(avatarLocalPath);

  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');
  if (!avatarLocalPath) {
    console.log('Error in avatar file ');

    throw new ApiError(400, 'Avatar file is required');
  }

  // delete old avatar from Cloudinary
  const oldUser = await prisma.user.findUnique({ where: { id: req.user.id } });

  const avatarUpload = await uploadOnCloudinary(avatarLocalPath);
  if (!avatarUpload) throw new ApiError(500, 'Error uploading avatar');
  fs.unlinkSync(avatarLocalPath);
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatar: avatarUpload.url },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, getSafeUser(user), 'Avatar updated'));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const coverLocalPath = files?.coverImage?.[0]?.path;
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');
  if (!coverLocalPath) throw new ApiError(400, 'Cover file is required');

  const coverUpload = await uploadOnCloudinary(coverLocalPath);
  if (!coverUpload) throw new ApiError(500, 'Error uploading cover');
  fs.unlinkSync(coverLocalPath);
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { coverImage: coverUpload.url },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, getSafeUser(user), 'Cover updated'));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const currentUserId = req.user?.id;

  const channel = await prisma.user.findUnique({
    where: { username },
    include: {
      _count: {
        select: { subscribers: true, subscriptions: true },
      },
    },
  });

  if (!channel) throw new ApiError(404, 'Channel not found');

  let isSubscribed: boolean = false;
  if (currentUserId) {
    // Check Subscription Table
    const subscription = await prisma.subscription.findUnique({
      where: {
        subscriberId_channelId: {
          subscriberId: currentUserId,
          channelId: channel.id,
        },
      },
    });
    isSubscribed = !!subscription;
  }

  const responseData = {
    ...getSafeUser(channel),
    subscriberCount: channel._count.subscribers,
    channelsSubscribedToCount: channel._count.subscriptions,
    isSubscribed,
  };

  delete responseData._count;

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, 'Channel profile fetched'));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  if (!req.user?.id) throw new ApiError(401, 'Unauthorized');

  const history = await prisma.watchHistory.findMany({
    where: { userId: req.user.id },
    orderBy: { watchedAt: 'desc' },
    include: {
      video: {
        include: {
          user: {
            select: { fullname: true, username: true, avatar: true },
          },
        },
      },
    },
  });

  if (!history.length) throw new ApiError(404, 'No watch history found');

  const videos = history.map((h: any) => h.video);
  return res
    .status(200)
    .json(new ApiResponse(200, videos, 'Watch history fetched'));
});

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
