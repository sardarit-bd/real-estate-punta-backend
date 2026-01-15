import multer from 'multer';
import path from 'path';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedDocumentTypes = ['application/pdf'];

  console.log('Uploading file:', file);

  if (file.fieldname === 'image' || file.fieldname === 'images') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, WebP) are allowed'), false);
    }
  } else if (file.fieldname === 'file') {
    if (allowedDocumentTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  } else {
    cb(new Error('Invalid field name'), false);
  }
};

// Multer configuration
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  // limits: {
  //   fileSize: 5 * 1024 * 1024, // 5MB
  //   files: 10 // Max 10 files for multiple upload
  // }
});