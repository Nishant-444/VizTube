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
    // TODO: Move to persistent storage
    cb(null, uploadDir);
  },
  filename: function (req: Request, file: Express.Multer.File, cb) {
    const userId = req.user?.id || 'guest';
    const timestamp = Date.now();
    cb(null, userId + '-' + timestamp + '-' + file.originalname);
  },
});

export const upload = multer({ storage });
