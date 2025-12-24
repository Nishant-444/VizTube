declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ACCESS_TOKEN_SECRET: string;
      REFRESH_TOKEN_SECRET: string;
      ACCESS_TOKEN_EXPIRY: string;
      REFRESH_TOKEN_EXPIRY: string;
      MONGODB_URI: string;
      PORT: number;
      CLOUDINARY_CLOUD_NAME: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_API_SECRET: string;
      CORS_ORIGIN: string;
    }
  }
}

export {};
