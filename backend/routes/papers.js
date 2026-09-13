const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Paper = require("../models/Paper");
const { INSTITUTES } = require("../utils/catalog");

const router = express.Router();

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_FILES = 10;

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF, JPG, PNG or WEBP files are accepted"), false);
  },
  limits: { fileSize: 15 * 1024 * 1024 },
});

function cleanupFiles(files) {
  (files || []).forEach((f) => fs.unlink(path.join(uploadDir, f.filename), () => {}));
}

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

router.post("/", upload.array("files", MAX_FILES), async (req, res) => {
  try {
    const { instituteCode, branch, semester, examType, subjectName, subjectCode, year, uploaderName, uploaderContact, note } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Attach a PDF, or one-or-more photos of the paper" });
    }

    const institute = INSTITUTES.find((i) => i.code === instituteCode);
    if (!institute) {
      cleanupFiles(req.files);
      return res.status(400).json({ error: "Unknown institute" });
    }
    if (!branch || !semester || !examType || !subjectName || !year) {
      cleanupFiles(req.files);
      return res.status(400).json({ error: "Missing required fields" });
    }

    const hasPdf = req.files.some((f) => f.mimetype === "application/pdf");
    if (hasPdf && req.files.length > 1) {
      cleanupFiles(req.files);
      return res.status(400).json({ error: "A PDF should be a single file - don't mix it with photos" });
    }

    const files = req.files.map((f) => ({
      fileName: f.originalname,
      filePath: f.filename,
      mimeType: f.mimetype,
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
    cleanupFiles(req.files);
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

router.get("/:id/view", async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper || paper.status !== "approved") return res.status(404).json({ error: "Paper not found" });
    const file = paper.files[Number(req.query.index) || 0];
    if (!file) return res.status(404).json({ error: "Page not found" });

    const filePath = path.join(uploadDir, file.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File missing on server" });
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: "Could not open file" });
  }
});

router.get("/:id/download", async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper || paper.status !== "approved") return res.status(404).json({ error: "Paper not found" });
    const file = paper.files[Number(req.query.index) || 0];
    if (!file) return res.status(404).json({ error: "Page not found" });

    const filePath = path.join(uploadDir, file.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File missing on server" });

    paper.downloadCount += 1;
    await paper.save();

    res.download(filePath, file.fileName);
  } catch (err) {
    res.status(500).json({ error: "Download failed" });
  }
});

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
