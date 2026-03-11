import fs from 'fs';
import path from 'path';
import { Request } from 'express';
import multer from 'multer';

const uploadDir = path.resolve(process.cwd(), 'public', 'temp');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req: Request, file: Express.Multer.File, cb) {
    const userId = req.user?.id || 'guest';
    const timestamp = Date.now();
    cb(null, userId + '-' + timestamp + '-' + file.originalname);
  },
});

export const upload = multer({ storage });
