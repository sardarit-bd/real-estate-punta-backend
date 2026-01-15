import { uploadServices } from "./upload.services.js";

// Upload single image
const uploadSingleImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const result = await uploadServices.uploadSingleFile(
            req.file.buffer,
            'properties'
        );

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload image'
        });
    }
};

// Upload multiple images
const uploadMultipleImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No image files provided'
            });
        }

        const results = await uploadServices.uploadMultipleFiles(
            req.files,
            'properties'
        );

        res.status(200).json({
            success: true,
            message: `${results.length} images uploaded successfully`,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload images'
        });
    }
};

// Upload PDF/document
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No document file provided'
            });
        }

        const result = await uploadServices.uploadSingleFile(
            req.file.buffer,
            'properties',
            'raw'
        );

        res.status(200).json({
            success: true,
            message: 'Document uploaded successfully',
            data: {
                ...result,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload document'
        });
    }
};

// Delete file
const deleteDocument = async (req, res) => {
    try {
        const { publicId } = req.params;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: 'Public ID is required'
            });
        }

        const deleted = await uploadServices.deleteFile(publicId, 'pdf');

        if (deleted) {
            res.status(200).json({
                success: true,
                message: 'File deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'File not found or already deleted'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete file'
        });
    }
};
const deleteImage = async (req, res) => {
    try {
        const { publicId } = req.params;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: 'Public ID is required'
            });
        }

        const deleted = await uploadServices.deleteFile(publicId);

        if (deleted) {
            res.status(200).json({
                success: true,
                message: 'File deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'File not found or already deleted'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete file'
        });
    }
};
// Handle multer errors
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size exceeds 5MB limit'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Maximum 10 files allowed'
            });
        }
    }

    if (error.message) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    next(error);
};

export const uploadControllers = {
    uploadSingleImage,
    uploadMultipleImages,
    uploadDocument,
    deleteDocument,
    deleteImage,
    handleMulterError
};