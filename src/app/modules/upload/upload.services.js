import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Upload single file
const uploadSingleFile = (fileBuffer, folder = 'properties', resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
        format: resourceType === 'image' ? 'webp' : 'pdf', // Auto convert to webp for images
        quality: 'auto:good'
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Failed to upload file: ${error.message}`));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            size: result.bytes
          });
        }
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// Upload multiple files
const uploadMultipleFiles = async (files, folder = 'properties') => {
  const uploadPromises = files.map(file => 
    uploadSingleFile(file.buffer, folder, file.mimetype.startsWith('image') ? 'image' : 'raw')
  );
  
  return await Promise.all(uploadPromises);
};

// Delete file from Cloudinary
const deleteFile = async (publicId, fileType = 'image') => {
const id = 'properties/' + publicId
const resourceType = fileType === 'pdf' ? 'raw' : 'image';
  try {
    const result = await cloudinary.uploader.destroy(id, {
        resource_type: resourceType
    });
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    return false;
  }
};

export const uploadServices = {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile
};