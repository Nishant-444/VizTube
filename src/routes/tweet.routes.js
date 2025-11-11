import { Router } from 'express';
import * as tweetController from '../controllers/tweet.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validateMongoId } from '../validators/auth.validators.js';

const router = Router();
router.use(verifyJWT);

router.route('/').post(tweetController.createTweet);
router
  .route('/user/:userId')
  .get(validateMongoId('userId'), tweetController.getUserTweets);
router
  .route('/:tweetId')
  .patch(validateMongoId('tweetId'), tweetController.updateTweet)
  .delete(validateMongoId('tweetId'), tweetController.deleteTweet);

export default router;
