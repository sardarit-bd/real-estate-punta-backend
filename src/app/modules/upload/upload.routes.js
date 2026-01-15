import express from 'express';

import { upload } from '../../middlewares/upload.js';
import { uploadControllers } from './upload.controller.js';

const router = express.Router();

// Single image upload
router.post(
  '/image',
  upload.single('image'),
  uploadControllers.uploadSingleImage
);

// Multiple images upload
router.post(
  '/images',
  upload.array('images', 10),
  uploadControllers.uploadMultipleImages
);

// PDF/document upload
router.post(
  '/document',
  upload.single('file'),
  uploadControllers.uploadDocument
);

// Delete file from Cloudinary
router.delete(
  '/image/:publicId',
  uploadControllers.deleteImage
);

router.delete(
  '/document/:publicId',
  uploadControllers.deleteDocument
);

export const UploadRoutes = router;