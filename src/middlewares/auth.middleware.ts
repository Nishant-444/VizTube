import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
  interface JWTPayload {
    _id: string;
    email: string;
    username: string;
    fullname: string;
  }

  const token =
    req.cookies.accessToken ||
    req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Unauthorized');
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    ) as JWTPayload;
    const user = await User.findById(decodedToken?._id).select(
      '-password -refreshToken'
    );

    if (!user) {
      throw new ApiError(401, 'Unauthorized');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`JWT verification failed: ${error.message}`);
    }
    throw new ApiError(401, 'Unauthorized. Invalid or expired token.');
  }
});
