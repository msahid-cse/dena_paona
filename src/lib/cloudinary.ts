import { v2 as cloudinary } from 'cloudinary';

// Configure from CLOUDINARY_URL env var (parsed automatically)
cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });

/**
 * Upload a base64 data URI or remote URL to Cloudinary.
 * Returns the secure URL of the uploaded image.
 */
export async function uploadImage(dataUri: string, folder = 'dena_paona/avatars'): Promise<string> {
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
    resource_type: 'image',
  });
  return result.secure_url;
}

export default cloudinary;
