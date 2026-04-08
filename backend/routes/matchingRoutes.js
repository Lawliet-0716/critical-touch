const express = require("express");
const router = express.Router();

const { findMatchingDrivers } = require("../controllers/matchingController");
const { protect } = require("../middleware/protect");

// =======================
// 🚑 TRIGGER MATCHING
// =======================
router.post("/match", protect, async (req, res) => {
  try {
    const booking = req.body;

    const io = req.app.get("io");

    const drivers = await findMatchingDrivers(booking, io);

    res.json({
      message: "Matching completed",
      drivers,
    });
  } catch (error) {
    console.error("❌ Matching route error:", error);
    res.status(500).json({ message: "Matching failed" });
  }
});

module.exports = router;
