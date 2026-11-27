import { Router } from 'express';
import * as videoController from '../controllers/video.controller.js';
import { optionalAuth, verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

router
  .route('/')
  .get(optionalAuth, videoController.getAllVideos)
  .post(
    verifyJWT,
    upload.fields([
      { name: 'videoFile', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
    videoController.publishAVideo
  );

// must come before '/:videoId'
router.route('/feed').get(verifyJWT, videoController.getSubscriptionFeed);

router
  .route('/:videoId')
  .get(optionalAuth, videoController.getVideoById)
  .delete(verifyJWT, videoController.deleteVideo)
  .patch(verifyJWT, upload.single('thumbnail'), videoController.updateVideo);

router
  .route('/:videoId/status')
  .get(optionalAuth, videoController.getVideoStatus);
router
  .route('/:videoId/transcript')
  .get(optionalAuth, videoController.getVideoTranscript);
router.route('/:videoId/view').post(optionalAuth, videoController.recordView);
router
  .route('/:videoId/reprocess')
  .post(verifyJWT, videoController.reprocessVideo);

router
  .route('/toggle/publish/:videoId')
  .patch(verifyJWT, videoController.togglePublishStatus);

export default router;
