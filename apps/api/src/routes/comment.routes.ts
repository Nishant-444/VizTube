import { Router } from 'express';
import * as commentController from '../controllers/comment.controller.js';
import { optionalAuth, verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router
  .route('/:videoId')
  .get(optionalAuth, commentController.getVideoComments)
  .post(verifyJWT, commentController.addComment);

router
  .route('/c/:commentId')
  .delete(verifyJWT, commentController.deleteComment)
  .patch(verifyJWT, commentController.updateComment);

router
  .route('/c/:commentId/replies')
  .get(optionalAuth, commentController.getCommentReplies);

export default router;
