const express = require("express");
const router = express.Router();

const { generateToken } = require("../controllers/videoController");
const { protect } = require("../middleware/protect");

// =======================
// 🎥 GENERATE VIDEO TOKEN (SECURE)
// =======================
router.post("/token", protect, generateToken);

module.exports = router;
