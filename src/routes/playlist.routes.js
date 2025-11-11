import { Router } from 'express';
import * as playlistController from '../controllers/playlist.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { validateMongoId } from '../validators/auth.validators.js';

const router = Router();
router.use(verifyJWT);

router.route('/').post(playlistController.createPlaylist);

router
  .route('/user/:userId')
  .get(validateMongoId('userId'), playlistController.getUserPlaylists);

router
  .route('/:playlistId')
  .get(validateMongoId('playlistId'), playlistController.getPlaylistById)
  .patch(validateMongoId('playlistId'), playlistController.updatePlaylist)
  .delete(validateMongoId('playlistId'), playlistController.deletePlaylist);

router
  .route('/:playlistId/:videoId')
  .post(
    validateMongoId('playlistId'),
    validateMongoId('videoId'),
    playlistController.addVideoToPlaylist
  )
  .delete(
    validateMongoId('playlistId'),
    validateMongoId('videoId'),
    playlistController.removeVideoFromPlaylist
  );

export default router;
