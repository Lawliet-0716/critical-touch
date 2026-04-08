const express = require("express");
const router = express.Router();

const {
  createPreBooking,
  getMyBookings, // ✅ MUST BE IMPORTED
  getDispatchedBookings,
  acceptPreBooking,
  cancelPreBooking,
} = require("../controllers/preBookingController");

const { protect, authorize } = require("../middleware/protect");

// 🔐 protected route
router.post("/create", protect, createPreBooking);

// ✅ THIS LINE IS CRITICAL
router.get("/my", protect, authorize("patient"), getMyBookings);

// ❌ PATIENT: cancel before acceptance
router.put("/:id/cancel", protect, authorize("patient"), cancelPreBooking);

// 🚑 DRIVER ROUTES
router.get("/dispatched", protect, authorize("driver"), getDispatchedBookings);
router.put("/:id/accept", protect, authorize("driver"), acceptPreBooking);

module.exports = router;
