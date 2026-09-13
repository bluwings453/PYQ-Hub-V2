const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true }, // original filename, used for the download prompt
    url: { type: String, required: true }, // Cloudinary secure_url
    cloudinaryId: { type: String, required: true }, // Cloudinary public_id, needed to delete it later
    resourceType: { type: String, required: true, enum: ["raw", "image"] }, // "raw" for PDFs, "image" for photos
  },
  { _id: false }
);

const paperSchema = new mongoose.Schema(
  {
    instituteCode: { type: String, required: true, index: true },
    instituteName: { type: String, required: true },
    branch: { type: String, required: true, index: true },
    semester: { type: Number, required: true, min: 1, max: 8, index: true },
    examType: { type: String, required: true, enum: ["Mid Semester", "End Semester"] },
    subjectName: { type: String, required: true, trim: true },
    subjectCode: { type: String, trim: true },
    year: { type: Number, required: true },

    // "pdf" papers always have exactly one file; "images" papers can have several
    // (one per photographed page), shown/downloaded in the order they were added.
    fileType: { type: String, required: true, enum: ["pdf", "images"] },
    files: { type: [fileSchema], required: true, validate: (v) => v.length > 0 },
    fileSize: { type: Number }, // combined size of all files, for reference

    uploaderName: { type: String, trim: true },
    uploaderContact: { type: String, trim: true },
    note: { type: String, trim: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    upvotes: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Speeds up the common browse query: approved papers for one institute/branch/semester
paperSchema.index({ instituteCode: 1, branch: 1, semester: 1, status: 1 });

module.exports = mongoose.model("Paper", paperSchema);
