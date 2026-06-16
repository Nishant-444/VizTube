import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import { validateAiVideoFile } from '../validators/file.validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(verifyJWT);

router
  .route('/ingest')
  .post(
    upload.single('file'),
    validateAiVideoFile,
    asyncHandler(aiController.handleVideoUpload)
  );

router.route('/query').post(asyncHandler(aiController.askVideoQuestion));

export default router;
