// for trimming the username in params that is the url
export const normalizeUsername = (req, res, next) => {
  try {
    // check for username in params
    if (req.params.username) {
      // sanitize it
      req.params.username = req.params.username.trim().toLowerCase();
    }
    next();
  } catch (error) {
    throw new ApiError(
      500,
      'An internal error occurred while processing parameters'
    );
  }
};
