const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// Use memory storage so we can pass the buffer to Cloudinary or local disk
const upload = multer({ storage: multer.memoryStorage() });

// Configure Cloudinary from env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer to Cloudinary.
 * Falls back to saving locally in server/uploads/ when CLOUDINARY_CLOUD_NAME is absent.
 *
 * @param {Buffer} buffer
 * @param {string} folder  Cloudinary folder name
 * @returns {Promise<string>} Secure URL or local path
 */
function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      // Local fallback
      const uploadsDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFile(filePath, buffer, (err) => {
        if (err) return reject(err);
        resolve(`/uploads/${filename}`);
      });
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

module.exports = { upload, uploadToCloudinary };
