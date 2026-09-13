const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Uploads a file already sitting in memory (from multer's memoryStorage).
// resourceType is "raw" for PDFs and "image" for photos - passed in explicitly
// rather than relying on Cloudinary's auto-detection, so we always know for
// certain which bucket an asset lives in later (that matters for deleting it).
function uploadBuffer(buffer, originalName, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: "pyq-hub",
        public_id: originalName.replace(/\.[a-z0-9]+$/i, "").replace(/[^a-zA-Z0-9-_]/g, "_"),
        use_filename: true,
        unique_filename: true,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// Builds a download URL that forces "Save as" instead of opening inline
function attachmentUrl(secureUrl) {
  return secureUrl.replace("/upload/", "/upload/fl_attachment/");
}

module.exports = { cloudinary, uploadBuffer, attachmentUrl };
