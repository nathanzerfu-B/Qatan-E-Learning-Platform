# TODO: Add Cloudinary to Backend for Course Media Storage

- [x] Add cloudinary dependency to package.json
- [x] Update Prisma schema.prisma to add media fields (thumbnailUrl, videoUrls) to Course model
- [x] Run Prisma migration to apply schema changes
- [x] Create utils/cloudinary.js for Cloudinary configuration and upload functions
- [x] Extend courseController.js with media upload functions (uploadThumbnail, uploadVideo)
- [x] Add upload routes to routes/courses.js (POST /upload-thumbnail, POST /upload-video)
- [x] Update server.js to import and configure Cloudinary
- [x] Add Cloudinary environment variables to .env file
- [ ] Test media upload endpoints
