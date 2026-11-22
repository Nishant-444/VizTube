import { z } from "zod";

// mirrors apps/api/src/validators/auth.validators.ts
export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(16, "At most 16 characters")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/\d/, "Add a number")
  .regex(/^[a-zA-Z0-9!@#$]+$/, "Only letters, numbers and !@#$ are allowed");

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/x-matroska", "video/quicktime"];
export const MAX_IMAGE_MB = 20;
export const MAX_VIDEO_MB = 100;

export const imageFileError = (file?: File | null) => {
  if (!file) return undefined;
  if (!IMAGE_TYPES.includes(file.type)) return "Use a JPG, PNG or WEBP image";
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `Images must be under ${MAX_IMAGE_MB} MB`;
  return undefined;
};
