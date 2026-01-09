import { Router } from 'express';
import * as likeController from '../controllers/like.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyJWT);

router.route('/toggle/v/:videoId').post(likeController.toggleVideoLike);

router.route('/toggle/c/:commentId').post(likeController.toggleCommentLike);

router.route('/toggle/t/:tweetId').post(likeController.toggleTweetLike);

router.route('/videos').get(likeController.getLikedVideos);

export default router;
