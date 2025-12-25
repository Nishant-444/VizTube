import { Response, Request, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

// for trimming the username in params that is the url
export const normalizeUsername = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // check for username in params
    if (req.params.username) {
      // sanitize it
      req.params.username = req.params.username.trim().toLowerCase();
    }
    next();
  } catch (error) {
    throw new ApiError(
      500,
      'An internal error occurred while processing parameters'
    );
  }
};
