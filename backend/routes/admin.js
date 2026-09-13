const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const Paper = require("../models/Paper");
const requireAdmin = require("../middleware/adminAuth");

const router = express.Router();
const uploadDir = path.join(__dirname, "..", "uploads");

router.post("/login", (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Wrong password" });
  }
  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "12h" });
  res.json({ token });
});

router.use(requireAdmin);

router.get("/papers", async (req, res) => {
  const status = req.query.status || "pending";
  const papers = await Paper.find({ status }).sort({ createdAt: 1 });
  res.json(papers);
});

router.get("/papers/:id/file", async (req, res) => {
  const paper = await Paper.findById(req.params.id);
  if (!paper) return res.status(404).json({ error: "Paper not found" });
  const file = paper.files[Number(req.query.index) || 0];
  if (!file) return res.status(404).json({ error: "Page not found" });
  const filePath = path.join(uploadDir, file.filePath);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File missing on server" });
  res.sendFile(filePath);
});

router.patch("/papers/:id", async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "status must be approved or rejected" });
  }
  const paper = await Paper.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!paper) return res.status(404).json({ error: "Paper not found" });
  res.json(paper);
});

router.delete("/papers/:id", async (req, res) => {
  const paper = await Paper.findByIdAndDelete(req.params.id);
  if (!paper) return res.status(404).json({ error: "Paper not found" });

  (paper.files || []).forEach((f) => {
    const filePath = path.join(uploadDir, f.filePath);
    if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
  });

  res.json({ message: "Deleted" });
});

module.exports = router;
