import { ApiError } from '../utils/ApiError.js';
import { ErrorRequestHandler } from 'express';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let error = err;

  const prismaError = err as any;

  // p2002 - duplicate entry
  // p2025 - not found
  if (prismaError.code === 'P2002') {
    const field = (prismaError.meta?.target as string[])?.[0] || 'Field';
    error = new ApiError(409, `${field} already exists`);
  } else if (prismaError.code === 'P2025') {
    error = new ApiError(404, 'Record not found');
  }

  // Normalization
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Something went wrong';
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const response = {
    ...error,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
  };

  return res.status(error.statusCode).json(response);
};

export { errorHandler };
