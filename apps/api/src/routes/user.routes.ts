import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { optionalAuth, verifyJWT } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// validators
import {
  validateRegistration,
  validateLogin,
  validateChangePassword,
  validateUpdateDetails,
} from '../validators/auth.validators.js';

// file validators
import {
  validateRegistrationFiles,
  validateAvatarFile,
  validateCoverImageFile,
} from '../validators/file.validators.js';

// username normalizer
import { normalizeUsername } from '../middlewares/normalizeParams.middleware.js';

const router = Router();

// unsecured public routes
router.route('/register').post(
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    },
  ]),
  asyncHandler(validateRegistration),
  asyncHandler(validateRegistrationFiles),
  asyncHandler(userController.registerUser)
);

router
  .route('/login')
  .post(asyncHandler(validateLogin), asyncHandler(userController.loginUser));

router
  .route('/refresh-token')
  .post(asyncHandler(userController.refreshAccessToken));

// public channel page; login only adds `isSubscribed`
router
  .route('/c/:username')
  .get(
    optionalAuth,
    asyncHandler(normalizeUsername),
    asyncHandler(userController.getUserChannelProfile)
  );

// jwt secured routes

// This middleware runs for all routes defined AFTER it
router.use(verifyJWT);

router.route('/logout').post(asyncHandler(userController.logoutUser));

router
  .route('/change-password')
  .post(
    asyncHandler(validateChangePassword),
    asyncHandler(userController.changeCurrentPassword)
  );

router
  .route('/current-user-details')
  .get(asyncHandler(userController.getCurrentUser));

router
  .route('/update-account')
  .patch(
    asyncHandler(validateUpdateDetails),
    asyncHandler(userController.updateAccountDetails)
  );

router
  .route('/update-avatar')
  .patch(
    upload.fields([{ name: 'avatar', maxCount: 1 }]),
    asyncHandler(validateAvatarFile),
    asyncHandler(userController.updateUserAvatar)
  );

router
  .route('/update-cover-image')
  .patch(
    upload.fields([{ name: 'coverImage', maxCount: 1 }]),
    asyncHandler(validateCoverImageFile),
    asyncHandler(userController.updateUserCoverImage)
  );

router
  .route('/watch-history')
  .get(asyncHandler(userController.getWatchHistory));

export default router;
