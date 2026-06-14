import { Router } from 'express';
import * as tweetController from '../controllers/tweet.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyJWT);

router.route('/').post(tweetController.createTweet);
router.route('/user/:userId').get(tweetController.getUserTweets);
router
  .route('/:tweetId')
  .patch(tweetController.updateTweet)
  .delete(tweetController.deleteTweet);

export default router;
