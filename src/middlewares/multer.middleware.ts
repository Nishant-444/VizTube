// backend/src/middlewares/multer.middleware.ts
import fs from 'fs';
import path from 'path';
import { Request } from 'express';
import multer from 'multer';

const uploadDir = path.resolve(process.cwd(), 'public', 'temp');
const containerUploadDir = path.resolve('/app', 'public', 'temp');

if (
  uploadDir !== containerUploadDir &&
  !uploadDir.endsWith(path.join('public', 'temp'))
) {
  throw new Error('Upload path must be ./public/temp or /app/public/temp');
}

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === 'EACCES') {
    console.error(
      `EACCES: Permission denied creating upload dir ${uploadDir}`,
      error
    );
  }
  throw error;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req: Request, file: Express.Multer.File, cb) {
    const userId = (req as any).user?.id || 'guest';
    const timestamp = Date.now();
    cb(null, userId + '-' + timestamp + '-' + file.originalname);
  },
});

// The Unified, Smart Multer Instance
export const upload = multer({
  storage,
  limits: {
    // We set a global 100MB limit. This drops the connection immediately if exceeded.
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    // 1. Check Video Fields
    if (file.fieldname === 'videoFile') {
      const ALLOWED_VIDEO_TYPES = [
        'video/mp4',
        'video/webm',
        'video/x-matroska', // .mkv
        'video/quicktime', // .mov
      ];
      if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid video format. Must be MP4, WEBM, MKV, or MOV.'));
      }
    }
    // 2. Check Image Fields (Thumbnail, Avatar, Cover Image)
    else if (
      file.fieldname === 'thumbnail' ||
      file.fieldname === 'avatar' ||
      file.fieldname === 'coverImage'
    ) {
      const ALLOWED_IMAGE_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/jpg',
      ];
      if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid image format. Must be JPG, PNG, or WEBP.'));
      }
    }
    // 3. Reject any unexpected fields instantly
    else {
      cb(new Error(`Unexpected upload field: ${file.fieldname}`));
    }
  },
});
