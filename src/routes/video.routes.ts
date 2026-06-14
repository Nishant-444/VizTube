import { Router } from 'express';
import * as videoController from '../controllers/video.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

router.use(verifyJWT);

router
  .route('/')
  .get(videoController.getAllVideos)
  .post(
    upload.fields([
      { name: 'videoFile', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
    videoController.publishAVideo
  );

router
  .route('/:videoId')
  .get(videoController.getVideoById)
  .delete(videoController.deleteVideo)
  .patch(upload.single('thumbnail'), videoController.updateVideo);

router
  .route('/toggle/publish/:videoId')
  .patch(videoController.togglePublishStatus);

export default router;
