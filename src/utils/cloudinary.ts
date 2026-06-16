import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { CloudinaryResponse } from '../types/cloudinary.types.js';
import 'dotenv/config';

const projectTempDir = path.resolve(process.cwd(), 'public', 'temp');
const containerTempDir = path.resolve('/app', 'public', 'temp');

const isTempPath = (targetPath: string) => {
  const resolved = path.resolve(targetPath);
  return (
    resolved.startsWith(`${projectTempDir}${path.sep}`) ||
    resolved.startsWith(`${containerTempDir}${path.sep}`)
  );
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (
  localFilePath: string
): Promise<CloudinaryResponse | null> => {
  try {
    if (!localFilePath) return null;

    if (!isTempPath(localFilePath)) {
      console.error('Rejected non-temp upload path:', localFilePath);
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto', // Cloudinary auto-detects video vs image
    });

    console.log(`Cloudinary Upload Success: ${response.url}`);

    // WE NO LONGER DELETE THE FILE HERE.
    // The controller/aiPipeline is responsible for disk cleanup.

    return response;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return null;
  }
};

// We add resourceType with a default of 'image' so it doesn't break your existing code
const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    console.log(`Cloudinary Delete [${resourceType}]:`, result);
    return result;
  } catch (error) {
    console.error('Cloudinary Deletion Error:', error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
