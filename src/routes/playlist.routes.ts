import { Router } from 'express';
import * as playlistController from '../controllers/playlist.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyJWT);

router.route('/').post(playlistController.createPlaylist);

router.route('/user/:userId').get(playlistController.getUserPlaylists);

router
  .route('/:playlistId')
  .get(playlistController.getPlaylistById)
  .patch(playlistController.updatePlaylist)
  .delete(playlistController.deletePlaylist);

router
  .route('/:playlistId/:videoId')
  .post(playlistController.addVideoToPlaylist)
  .delete(playlistController.removeVideoFromPlaylist);

export default router;
