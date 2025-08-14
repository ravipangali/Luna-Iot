const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const popupDir = path.join(uploadsDir, 'popups');
        if (!fs.existsSync(popupDir)) {
            fs.mkdirSync(popupDir, { recursive: true });
        }
        cb(null, popupDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'popup-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        // Provide more specific error message
        cb(new Error(`File type ${file.mimetype} is not allowed. Only image files (jpg, png, gif, etc.) are accepted.`), false);
    }
};

// Configure multer with better error handling
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

// Add error handling wrapper
const uploadWithErrorHandling = (fieldName) => {
    return (req, res, next) => {
        upload.single(fieldName)(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File too large. Maximum size is 5MB.'
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: `Upload error: ${err.message}`
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }
            next();
        });
    };
};

module.exports = { upload, uploadWithErrorHandling };