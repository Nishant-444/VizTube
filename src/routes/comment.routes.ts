import { Router } from 'express';
import * as commentController from '../controllers/comment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validateMongoId } from '../validators/auth.validators.js';

const router = Router();

router.use(verifyJWT);

router
  .route('/:videoId')
  .get(validateMongoId('videoId'), commentController.getVideoComments)
  .post(validateMongoId('videoId'), commentController.addComment);

router
  .route('/c/:commentId')
  .delete(validateMongoId('commentId'), commentController.deleteComment)
  .patch(validateMongoId('commentId'), commentController.updateComment);

export default router;
