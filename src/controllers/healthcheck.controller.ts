// import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const healthcheck = asyncHandler(async (req, res) => {
  return res.send(`<h1>Health Check Passed!</h1>`);
});

export { healthcheck };
