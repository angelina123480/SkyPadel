const multer = require('multer');

// Serverless (Vercel) filesystems are read-only/ephemeral at runtime, so uploads
// are kept in memory and pushed to Vercel Blob storage by the controller instead
// of being written to disk.
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, WEBP or SVG images are allowed.'));
  }
  cb(null, true);
}

const uploadProductImage = multer({
  storage,
  fileFilter,
  // Stay under Vercel Serverless Functions' request body limit (4.5MB).
  limits: { fileSize: 4 * 1024 * 1024 }
});

module.exports = { uploadProductImage };
