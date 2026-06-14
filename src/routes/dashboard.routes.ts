import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/stats').get(dashboardController.getChannelStats);
router.route('/videos').get(dashboardController.getChannelVideos);

export default router;
