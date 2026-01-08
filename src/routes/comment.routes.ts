import { Router } from 'express';
import * as commentController from '../controllers/comment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router
  .route('/:videoId')
  .get(commentController.getVideoComments)
  .post(commentController.addComment);

router
  .route('/c/:commentId')
  .delete(commentController.deleteComment)
  .patch(commentController.updateComment);

export default router;
