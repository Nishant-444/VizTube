// import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const healthcheck = asyncHandler(async (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Health check passed!',
  });
});

export { healthcheck };
