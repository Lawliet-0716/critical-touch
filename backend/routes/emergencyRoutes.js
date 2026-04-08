const express = require("express");
const router = express.Router();

const emergencyController = require("../controllers/emergencyController");
const middleware = require("../middleware/protect");

// 🧑‍⚕️ Patient → create emergency
router.post(
  "/request",
  middleware.protect,
  middleware.authorize("patient"),
  emergencyController.createEmergency,
);

// 🚑 Driver → view pending
router.get(
  "/pending",
  middleware.protect,
  middleware.authorize("driver"),
  emergencyController.getPendingEmergencies,
);

// 🚑 Driver → accept request
router.put(
  "/:id/accept",
  middleware.protect,
  middleware.authorize("driver"),
  emergencyController.acceptEmergency,
);

// 🏁 Driver → complete trip
router.put(
  "/:id/complete",
  middleware.protect,
  middleware.authorize("driver"),
  emergencyController.completeEmergency,
);

module.exports = router;
