import { Document } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: Document & {
        _id: string;
        username: string;
        email: string;
        fullname: string;
        avatar: string;
        coverImage: string;
        watchHistory: string[];
      };
    }
  }
}

export {};
