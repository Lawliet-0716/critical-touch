const crypto = require("crypto");
const Consultation = require("../models/Consultation");
const mongoose = require("mongoose");

// 🔴 Replace from ZEGO dashboard later
const appID = process.env.ZEGO_APP_ID;
const serverSecret = process.env.ZEGO_SERVER_SECRET;

// =======================
// 🎥 GENERATE VIDEO TOKEN (SECURE 🔥)
// =======================
exports.generateToken = async (req, res) => {
  try {
    if (!appID || !serverSecret) {
      return res.status(500).json({
        message:
          "Video calling is not configured (missing ZEGO_APP_ID / ZEGO_SERVER_SECRET)",
      });
    }

    const { consultationId } = req.body;

    if (!consultationId) {
      return res.status(400).json({ message: "Consultation ID required" });
    }

    if (!mongoose.Types.ObjectId.isValid(consultationId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    // 🔍 Fetch consultation
    const consultation = await Consultation.findById(consultationId);

    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    // ❌ Only allow accepted consultations
    if (consultation.status !== "accepted") {
      return res.status(400).json({ message: "Consultation not accepted yet" });
    }

    const userId = req.user._id || req.user.id;

    // 🔐 SECURITY CHECK
    if (
      consultation.patient.toString() !== userId &&
      consultation.hospital.toString() !== userId
    ) {
      return res.status(403).json({
        message: "Not authorized to join this call",
      });
    }

    // 🔥 Use consultation roomId
    const roomId = consultation.roomId;

    if (!roomId) {
      return res.status(500).json({ message: "Consultation room is missing" });
    }

    res.json({
      // Zego SDK expects appID as a number
      appID: Number(appID),
      // ✅ For development: generate kitToken on client via generateKitTokenForTest.
      // Do NOT expose serverSecret in production.
      serverSecret,
      roomId,
    });
  } catch (error) {
    console.error("❌ Token Error:", error);
    res.status(500).json({ message: "Token generation failed" });
  }
};
