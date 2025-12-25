import { Router } from 'express';
import * as videoController from '../controllers/video.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import { validateMongoId } from '../validators/auth.validators.js';

const router = Router();

// Apply JWT auth to ALL routes in this file
router.use(verifyJWT);
// GET /api/v1/videos
// POST /api/v1/videos
router
  .route('/')
  .get(videoController.getAllVideos)
  .post(
    upload.fields([
      {
        name: 'videoFile',
        maxCount: 1,
      },
      {
        name: 'thumbnail',
        maxCount: 1,
      },
    ]),
    videoController.publishAVideo
  );

// GET /api/v1/videos/:videoId
// DELETE /api/v1/videos/:videoId
// PATCH /api/v1/videos/:videoId
router
  .route('/:videoId')
  .get(validateMongoId('videoId'), videoController.getVideoById)
  .delete(validateMongoId('videoId'), videoController.deleteVideo)
  .patch(
    upload.single('thumbnail'),
    validateMongoId('videoId'),
    videoController.updateVideo
  );

// PATCH /api/v1/videos/toggle/publish/:videoId
router
  .route('/toggle/publish/:videoId')
  .patch(validateMongoId('videoId'), videoController.togglePublishStatus);

export default router;
