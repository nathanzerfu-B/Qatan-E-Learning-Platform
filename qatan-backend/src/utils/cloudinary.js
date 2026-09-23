import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for thumbnails (images)
const thumbnailStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'qatan/course-thumbnails',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }],
  },
});

// Storage for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'qatan/course-videos',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv'],
    resource_type: 'video',
  },
});

// Multer upload middlewares
export const uploadThumbnail = multer({ storage: thumbnailStorage });
export const uploadVideo = multer({ storage: videoStorage });

// Upload functions
export const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    // Handle both file path (from disk storage) and buffer (from memory storage)
    const uploadOptions = { folder };

    if (file.path) {
      // File from disk storage
      cloudinary.uploader.upload(file.path, uploadOptions, (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      });
    } else if (file.buffer) {
      // File from memory storage (buffer) - convert to base64 for reliable upload
      const buffer = Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer);
      const base64String = `data:${file.mimetype};base64,${buffer.toString('base64')}`;

      cloudinary.uploader.upload(base64String, uploadOptions, (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      });
    } else {
      reject(new Error('Invalid file format'));
    }
  });
};

export const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
};

export default cloudinary;
