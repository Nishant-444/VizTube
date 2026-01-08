import { ApiError } from '../utils/ApiError.js';
import { Request, Response, NextFunction } from 'express';

// Helper function for password rules
const validatePasswordRules = (password: string) => {
  const errors: string[] = [];
  if (!password) {
    errors.push('Password is required');
    return errors;
  }

  if (password.length < 8 || password.length > 16) {
    errors.push('Password must be between 8 and 16 characters');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  const allowedPasswordChars = /^[a-zA-Z0-9!@#$]+$/;
  if (!allowedPasswordChars.test(password)) {
    errors.push('Password contains invalid characters. Only !@#$ are allowed.');
  }
  return errors;
};

export const validateRegistration = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { fullname, username, email, password } = req.body;
  const errors: string[] = [];

  // fullname validation
  if (!fullname || fullname.trim() === '') {
    errors.push('Full name is required');
  }

  // email validation
  if (!email || email.trim() === '') {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Invalid email address');
    }
  }

  // username validation
  if (!username || username.trim() === '') {
    errors.push('Username is required');
  } else {
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      errors.push('Username must be at least 3 characters');
    }
    if (/\s/.test(trimmedUsername)) {
      errors.push('Username cannot contain spaces');
    }
  }

  // password validation
  const passwordErrors = validatePasswordRules(password);
  errors.push(...passwordErrors);

  // error check
  if (errors.length > 0) {
    throw new ApiError(422, 'Validation failed', errors);
  }

  // sanitize req.body
  req.body.fullname = fullname.trim();
  req.body.username = username.trim().toLowerCase();
  req.body.email = email.trim();

  next();
};

export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, username, password } = req.body;
  const errors: string[] = [];

  if (
    (!email || email.trim() === '') &&
    (!username || username.trim() === '')
  ) {
    errors.push('Email or username is required');
  }

  if (!password || password === '') {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    throw new ApiError(422, 'Login validation failed', errors);
  }

  // sanitize
  if (email) {
    req.body.email = email.trim();
  }
  if (username) {
    req.body.username = username.trim();
  }

  next();
};

export const validateChangePassword = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { oldPassword, newPassword } = req.body;
  const errors: string[] = [];

  // check existence
  if (!oldPassword) {
    errors.push('Old password is required');
  }
  if (!newPassword) {
    errors.push('New password is required');
  }
  if (oldPassword === newPassword) {
    errors.push('New password cannot be the same as the old password');
  }

  // validate newPassword
  if (!newPassword) {
    errors.push('New password is required');
  } else {
    const passwordErrors = validatePasswordRules(newPassword);
    errors.push(...passwordErrors);
  }

  // check errors
  if (errors.length > 0) {
    throw new ApiError(422, 'Password change validation failed', errors);
  }

  next();
};

export const validateUpdateDetails = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { fullname, email, username } = req.body;
  const errors: string[] = [];

  if (!fullname || fullname.trim() === '') {
    errors.push('Full name is required');
  }
  if (!email || email.trim() === '') {
    errors.push('Email is required');
  }
  if (!username || username.trim() === '') {
    errors.push('Username is required');
  }

  // You can add more checks here (e.g., email format)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('Invalid email address');
  }

  if (username && /\s/.test(username.trim())) {
    errors.push('Username cannot contain spaces');
  }

  if (errors.length > 0) {
    throw new ApiError(422, 'Update validation failed', errors);
  }

  // sanitize
  req.body.fullname = fullname.trim();
  req.body.email = email.trim();
  req.body.username = username.trim().toLowerCase();

  next();
};
