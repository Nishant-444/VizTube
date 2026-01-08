import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      // This tells TS: "req.user" is exactly the User model from Prisma schema
      user?: User;
    }
  }
}

// This export is necessary to make this file a "module"
export {};
