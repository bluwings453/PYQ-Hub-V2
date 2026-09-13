const express = require("express");
const jwt = require("jsonwebtoken");
const Paper = require("../models/Paper");
const requireAdmin = require("../middleware/adminAuth");
const { cloudinary } = require("../config/cloudinary");

const router = express.Router();

// POST /api/admin/login - single shared password for the moderator(s), see .env
router.post("/login", (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Wrong password" });
  }
  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "12h" });
  res.json({ token });
});

// Everything below requires a valid admin token
router.use(requireAdmin);

// GET /api/admin/papers?status=pending
router.get("/papers", async (req, res) => {
  const status = req.query.status || "pending";
  const papers = await Paper.find({ status }).sort({ createdAt: 1 });
  res.json(papers);
});

// PATCH /api/admin/papers/:id - approve or reject
router.patch("/papers/:id", async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "status must be approved or rejected" });
  }
  const paper = await Paper.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!paper) return res.status(404).json({ error: "Paper not found" });
  res.json(paper);
});

// DELETE /api/admin/papers/:id - remove a bad submission, including its Cloudinary files
router.delete("/papers/:id", async (req, res) => {
  const paper = await Paper.findByIdAndDelete(req.params.id);
  if (!paper) return res.status(404).json({ error: "Paper not found" });

  await Promise.all(
    (paper.files || []).map((f) =>
      cloudinary.uploader.destroy(f.cloudinaryId, { resource_type: f.resourceType }).catch(() => {})
    )
  );

  res.json({ message: "Deleted" });
});

module.exports = router;
