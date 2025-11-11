import { Router } from 'express';
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from '../controllers/subscription.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validateMongoId } from '../validators/auth.validators.js';

const router = Router();
router.use(verifyJWT);

router
  .route('/c/:channelId')
  .post(validateMongoId('channelId'), toggleSubscription)
  .get(validateMongoId('channelId'), getUserChannelSubscribers);

router
  .route('/u/:subscriberId')
  .get(validateMongoId('subscriberId'), getSubscribedChannels);

export default router;
