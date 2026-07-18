import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { prisma } from '../lib/prisma.js';

interface JWTPayload {
  id: string;
  email: string;
  username: string;
  fullname: string;
}

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Unauthorized request');
  }

  let decodedToken: JWTPayload;

  try {
    decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as JWTPayload;
  } catch (error) {
    const errorMessage = (error as any)?.message || 'Invalid access token';
    throw new ApiError(401, errorMessage);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: decodedToken.id,
    },
    select: {
      id: true,
      username: true,
      email: true,
      fullname: true,
      avatar: true,
      coverImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(401, 'Invalid Access Token');
  }

  req.user = user;
  next();

});
