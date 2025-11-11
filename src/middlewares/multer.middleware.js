import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp');
  },
  filename: function (req, file, cb) {
    const userId = req.user?.id || 'guest';
    const timestamp = Date.now();
    const originalName = file.originalname;
    cb(null, userId + '-' + timestamp + '-' + originalName);
  },
});

export const upload = multer({
  storage,
});
