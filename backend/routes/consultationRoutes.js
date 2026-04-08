const express = require("express");
const router = express.Router();

const consultationController = require("../controllers/consultationController");
const { protect } = require("../middleware/protect");

// =======================
// 📋 FETCH ROUTES
// =======================

// 🏥 Hospital / Doctor → get all active consultations
router.get("/all", protect, consultationController.getAllConsultations);

// 👤 Patient → get current consultation
router.get("/my", protect, consultationController.getMyConsultation);

// =======================
// ⚡ ACTION ROUTES
// =======================

// 📹 Book consultation
router.post("/book", protect, consultationController.bookConsultation);

// 🩺 Accept consultation
router.put("/accept/:id", protect, consultationController.acceptConsultation);

// ✅ Complete consultation
router.put(
  "/complete/:id",
  protect,
  consultationController.completeConsultation,
);

// =======================
// 🔍 SINGLE CONSULTATION (KEEP LAST)
// =======================
router.get("/:id", protect, consultationController.getConsultationById);

module.exports = router;
