import { ApiError } from '../utils/ApiError.js';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// individual file validator
const validateFile = (file, fieldName) => {
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
export const validateRegistrationFiles = (req, res, next) => {
  const { avatar, coverImage } = req.files;

  if (avatar && avatar[0]?.path) {
    validateFile(avatar[0], 'Avatar');
  }

  if (coverImage && coverImage[0]?.path) {
    validateFile(coverImage[0], 'Cover Image');
  }

  next();
};

// avatar file validator
export const validateAvatarFile = (req, res, next) => {
  if (!req.file) {
    throw new ApiError(400, 'Avatar file is required for update');
  }

  // check integrity
  validateFile(req.file, 'Avatar');

  next();
};

// cover image file validator
export const validateCoverImageFile = (req, res, next) => {
  if (!req.file) {
    throw new ApiError(400, 'Cover image file is required for update');
  }

  // check integrity
  validateFile(req.file, 'Cover Image');

  next();
};
