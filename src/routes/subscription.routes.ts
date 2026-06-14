import { Router } from 'express';
import * as subscriptionController from '../controllers/subscription.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyJWT);

router
  .route('/c/:channelId')
  .post(subscriptionController.toggleSubscription)
  .get(subscriptionController.getUserChannelSubscribers);

router
  .route('/u/:subscriberId')
  .get(subscriptionController.getSubscribedChannels);

export default router;
