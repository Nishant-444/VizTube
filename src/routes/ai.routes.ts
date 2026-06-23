import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(verifyJWT);


router.route('/query').post(asyncHandler(aiController.askVideoQuestion));

export default router;
