import { Router } from 'express';
import {
  getLikedVideos,
  toggleCommentLike,
  toggleVideoLike,
  toggleTweetLike,
} from '../controllers/like.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validateMongoId } from '../validators/auth.validators.js';

const router = Router();
router.use(verifyJWT);

router
  .route('/toggle/v/:videoId')
  .post(validateMongoId('videoId'), toggleVideoLike);

router
  .route('/toggle/c/:commentId')
  .post(validateMongoId('commentId'), toggleCommentLike);

router
  .route('/toggle/t/:tweetId')
  .post(validateMongoId('tweetId'), toggleTweetLike);

router.route('/videos').get(getLikedVideos);

export default router;
