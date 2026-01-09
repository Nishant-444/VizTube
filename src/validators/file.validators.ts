import { ApiError } from '../utils/ApiError.js';
import { Request, Response, NextFunction } from 'express';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// individual file validator
const validateFile = (file: Express.Multer.File, fieldName: string) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new ApiError(400, `${fieldName} must be a JPG, PNG, or WEBP`);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ApiError(
      400,
      `${fieldName} must be smaller than ${MAX_FILE_SIZE_MB}MB`
    );
  }
};

// combined files validator
export const validateRegistrationFiles = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { avatar, coverImage } = req.files as {
    avatar?: Express.Multer.File[];
    coverImage?: Express.Multer.File[];
  };

  if (avatar && avatar[0]?.path) {
    validateFile(avatar[0], 'Avatar');
  }

  if (coverImage && coverImage[0]?.path) {
    validateFile(coverImage[0], 'Cover Image');
  }

  next();
};

// avatar file validator
export const validateAvatarFile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const avatarFile = files?.avatar?.[0];

  if (!avatarFile) {
    throw new ApiError(400, 'Avatar file is required for update');
  }

  // check integrity
  validateFile(avatarFile, 'Avatar');

  next();
};

// cover image file validator
export const validateCoverImageFile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const coverImageFile = files?.coverImage?.[0];

  if (!coverImageFile) {
    throw new ApiError(400, 'Cover Image file is required for update');
  }
  // check integrity
  validateFile(coverImageFile, 'Cover Image');

  next();
};
