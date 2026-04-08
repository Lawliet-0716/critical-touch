const express = require("express");
const router = express.Router();

const {
  driverSignup,
  driverSignin,
  updateLocation, // ✅ ADDED
} = require("../controllers/driverController");
const { protect, authorize } = require("../middleware/protect");
const Driver = require("../models/Driver");

// PUBLIC
router.post("/signup", driverSignup);
router.post("/signin", driverSignin);

// PROTECTED
router.get("/me", protect, authorize("driver"), async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.id).select(
      "name phone licenseNumber ambulanceNumber ambulanceType role isAvailable location",
    );

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json({
      success: true,
      driver,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =======================
// 📍 UPDATE LOCATION (NEW)
// =======================
router.put("/location", protect, updateLocation); // ✅ ADDED

module.exports = router;
