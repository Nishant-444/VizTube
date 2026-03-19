import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
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

// configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (
  localFilePath: string
): Promise<CloudinaryResponse | null> => {
  try {
    if (!localFilePath) {
      console.log('No file path provided');
      return null;
    }

    if (!isTempPath(localFilePath)) {
      console.error('Rejected non-temp upload path:', localFilePath);
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
    });
    // console.log(JSON.stringify(response, null, 2));

    console.log(
      'File uploaded successfully on cloudinary. File src: ' + response.url
    );

    // once the file is uploaded, we would like to delete it from our server
    try {
      fs.unlinkSync(localFilePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EACCES') {
        console.error(
          `EACCES: Permission denied deleting file ${localFilePath}`,
          error
        );
      } else {
        throw error;
      }
    }
    return response;
  } catch (error) {
    console.log('Error on cloudinary', error);
    if (
      localFilePath &&
      isTempPath(localFilePath) &&
      fs.existsSync(localFilePath)
    ) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (unlinkError) {
        if ((unlinkError as NodeJS.ErrnoException).code === 'EACCES') {
          console.error(
            `EACCES: Permission denied deleting file ${localFilePath}`,
            unlinkError
          );
        }
      }
    }
    return null;
  }
};

const deleteFromCloudinary = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Deleted from cloudinary. Public id: ', publicId);
  } catch (error) {
    console.log('Error deleting from cloudinary', error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
