const express = require("express");
const multer = require("multer");
const Paper = require("../models/Paper");
const { INSTITUTES } = require("../utils/catalog");
const { uploadBuffer, attachmentUrl } = require("../config/cloudinary");

const router = express.Router();

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_FILES = 10;

// Files are held in memory just long enough to stream them to Cloudinary -
// nothing is written to this server's own disk, which is what makes uploads
// survive a Render redeploy/restart.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF, JPG, PNG or WEBP files are accepted"), false);
  },
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB per file
});

// GET /api/papers - browse approved papers with optional filters
router.get("/", async (req, res) => {
  try {
    const { institute, branch, semester, examType, year, q } = req.query;

    const filter = { status: "approved" };
    if (institute) filter.instituteCode = institute;
    if (branch) filter.branch = branch;
    if (semester) filter.semester = Number(semester);
    if (examType) filter.examType = examType;
    if (year) filter.year = Number(year);
    if (q) filter.subjectName = { $regex: q, $options: "i" };

    const papers = await Paper.find(filter).sort({ year: -1, createdAt: -1 }).limit(200);
    res.json(papers);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch papers" });
  }
});

// GET /api/papers/subjects - distinct subject list for a given institute/branch/semester,
// used to narrow the search box as the person picks filters
router.get("/subjects", async (req, res) => {
  try {
    const { institute, branch, semester } = req.query;
    const filter = { status: "approved" };
    if (institute) filter.instituteCode = institute;
    if (branch) filter.branch = branch;
    if (semester) filter.semester = Number(semester);

    const subjects = await Paper.distinct("subjectName", filter);
    res.json(subjects.sort());
  } catch (err) {
    res.status(500).json({ error: "Could not fetch subjects" });
  }
});

// POST /api/papers - contribute a new paper: either one PDF, or one-or-more
// photos of the pages (in the order they were added). Goes in as "pending".
router.post("/", upload.array("files", MAX_FILES), async (req, res) => {
  try {
    const { instituteCode, branch, semester, examType, subjectName, subjectCode, year, uploaderName, uploaderContact, note } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Attach a PDF, or one-or-more photos of the paper" });
    }

    const institute = INSTITUTES.find((i) => i.code === instituteCode);
    if (!institute) return res.status(400).json({ error: "Unknown institute" });
    if (!branch || !semester || !examType || !subjectName || !year) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const hasPdf = req.files.some((f) => f.mimetype === "application/pdf");
    if (hasPdf && req.files.length > 1) {
      return res.status(400).json({ error: "A PDF should be a single file - don't mix it with photos" });
    }

    // Promise.all preserves input order in its results, so pages stay in the
    // order the person added them.
    const uploadResults = await Promise.all(
      req.files.map((f) => uploadBuffer(f.buffer, f.originalname, hasPdf ? "raw" : "image"))
    );

    const files = uploadResults.map((r, i) => ({
      fileName: req.files[i].originalname,
      url: r.secure_url,
      cloudinaryId: r.public_id,
      resourceType: r.resource_type,
    }));
    const totalSize = req.files.reduce((sum, f) => sum + f.size, 0);

    const paper = await Paper.create({
      instituteCode: institute.code,
      instituteName: institute.name,
      branch,
      semester: Number(semester),
      examType,
      subjectName,
      subjectCode,
      year: Number(year),
      fileType: hasPdf ? "pdf" : "images",
      files,
      fileSize: totalSize,
      uploaderName,
      uploaderContact,
      note,
      status: "pending",
    });

    res.status(201).json({ message: "Thanks - your paper is in the review queue.", id: paper._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// GET /api/papers/:id/view?index=0 - open one page inline (new tab), no download prompt
router.get("/:id/view", async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper || paper.status !== "approved") return res.status(404).json({ error: "Paper not found" });
    const file = paper.files[Number(req.query.index) || 0];
    if (!file) return res.status(404).json({ error: "Page not found" });
    res.redirect(file.url);
  } catch (err) {
    res.status(500).json({ error: "Could not open file" });
  }
});

// GET /api/papers/:id/download?index=0 - force a "Save as" download of one page/file and count it
router.get("/:id/download", async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper || paper.status !== "approved") return res.status(404).json({ error: "Paper not found" });
    const file = paper.files[Number(req.query.index) || 0];
    if (!file) return res.status(404).json({ error: "Page not found" });

    paper.downloadCount += 1;
    await paper.save();

    res.redirect(attachmentUrl(file.url));
  } catch (err) {
    res.status(500).json({ error: "Download failed" });
  }
});

// PATCH /api/papers/:id/upvote - lightweight community quality signal, no auth required
router.patch("/:id/upvote", async (req, res) => {
  try {
    const paper = await Paper.findByIdAndUpdate(req.params.id, { $inc: { upvotes: 1 } }, { new: true });
    if (!paper) return res.status(404).json({ error: "Paper not found" });
    res.json({ upvotes: paper.upvotes });
  } catch (err) {
    res.status(500).json({ error: "Could not register upvote" });
  }
});

module.exports = router;
