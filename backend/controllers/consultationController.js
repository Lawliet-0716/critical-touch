const Consultation = require("../models/Consultation");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");

// =======================
// ✅ BOOK CONSULTATION
// =======================
exports.bookConsultation = async (req, res) => {
  try {
    const { doctor, hospitalId, scheduledAt } = req.body;

    if (!doctor || !hospitalId) {
      return res.status(400).json({
        message: "Doctor ID and Hospital ID required",
      });
    }

    const patientId = req.user._id || req.user.id;

    console.log("📥 Booking Consultation");
    console.log("Patient:", patientId);
    console.log("Doctor:", doctor);
    console.log("Hospital:", hospitalId);

    const consultation = await Consultation.create({
      patient: patientId,
      doctor,
      hospital: hospitalId,
      scheduledAt,
      status: "booked",
      roomId: uuidv4(),
    });

    console.log("✅ Created:", consultation._id);

    // 🔥 REAL-TIME EMIT TO HOSPITAL
    const io = req.app.get("io");

    io.to(`hospital_${hospitalId}`).emit("newConsultation", {
      consultation,
      patient: patientId,
    });

    res.status(201).json(consultation);
  } catch (error) {
    console.error("❌ Booking Error:", error);
    res.status(500).json({ message: "Failed to book consultation" });
  }
};

// =======================
// ✅ GET CONSULTATION BY ID
// =======================
exports.getConsultationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid consultation ID" });
    }

    const consultation = await Consultation.findById(id)
      .populate("patient", "name email")
      .populate("doctor")
      .populate("hospital", "hospitalName location");

    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    res.json(consultation);
  } catch (error) {
    console.error("❌ Fetch by ID Error:", error);
    res.status(500).json({ message: "Error fetching consultation" });
  }
};

// =======================
// ✅ GET CURRENT CONSULTATION (PATIENT)
// =======================
exports.getMyConsultation = async (req, res) => {
  try {
    const patientId = req.user._id || req.user.id;

    console.log("👤 Fetching consultation for:", patientId);

    const consultation = await Consultation.findOne({
      patient: patientId,
      status: { $in: ["booked", "accepted"] },
    })
      .populate("doctor")
      .populate("hospital", "hospitalName location")
      .sort({ createdAt: -1 });

    console.log("📋 Found:", consultation);

    res.json(consultation || null);
  } catch (error) {
    console.error("❌ My Consultation Error:", error);
    res.status(500).json({ message: "Error fetching consultation" });
  }
};

// =======================
// ✅ ACCEPT CONSULTATION
// =======================
exports.acceptConsultation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid consultation ID" });
    }

    const consultation = await Consultation.findById(id);

    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    console.log("🩺 Accepting:", consultation._id);

    consultation.status = "accepted";
    await consultation.save();

    const io = req.app.get("io");

    // 🔥 Notify patient
    io.to(consultation.patient.toString()).emit(
      "consultationAccepted",
      consultation,
    );

    res.json({
      message: "Consultation accepted",
      consultation,
    });
  } catch (error) {
    console.error("❌ Accept Error:", error);
    res.status(500).json({ message: "Error accepting consultation" });
  }
};

// =======================
// ✅ COMPLETE CONSULTATION
// =======================
exports.completeConsultation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid consultation ID" });
    }

    const consultation = await Consultation.findById(id);

    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    if (consultation.status === "completed") {
      return res.json({ message: "Already completed" });
    }

    console.log("✅ Completing consultation:", consultation._id);

    consultation.status = "completed";
    await consultation.save();

    const io = req.app.get("io");

    // 🔥 Notify patient + hospital
    io.to(consultation.patient.toString()).emit(
      "consultationCompleted",
      consultation,
    );

    io.to(`hospital_${consultation.hospital}`).emit(
      "consultationCompleted",
      consultation,
    );

    res.json({
      message: "Consultation completed",
      consultation,
    });
  } catch (error) {
    console.error("❌ Complete Error:", error);
    res.status(500).json({ message: "Error completing consultation" });
  }
};

// =======================
// ❌ CANCEL CONSULTATION (PATIENT)
// =======================
exports.cancelConsultation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid consultation ID" });
    }

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    const patientId = req.user._id || req.user.id;
    if (consultation.patient.toString() !== String(patientId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!["booked", "accepted"].includes(consultation.status)) {
      return res
        .status(400)
        .json({ message: "Only active consultations can be cancelled" });
    }

    consultation.status = "cancelled";
    await consultation.save();

    const io = req.app.get("io");
    if (io) {
      io.to(consultation.patient.toString()).emit(
        "consultationCancelled",
        consultation,
      );
      io.to(`hospital_${consultation.hospital}`).emit(
        "consultationCancelled",
        consultation,
      );
    }

    res.json({ success: true, consultation });
  } catch (error) {
    console.error("❌ Cancel Error:", error);
    res.status(500).json({ message: "Error cancelling consultation" });
  }
};

// =======================
// ✅ GET ALL CONSULTATIONS (HOSPITAL)
// =======================
exports.getAllConsultations = async (req, res) => {
  try {
    const hospitalId = req.user._id || req.user.id;

    console.log("🏥 Hospital:", hospitalId);

    const consultations = await Consultation.find({
      hospital: hospitalId,
      status: { $in: ["booked", "accepted"] },
    })
      .populate("patient", "name email")
      .populate("doctor")
      .sort({ createdAt: -1 });

    console.log("📋 Total found:", consultations.length);

    res.json(consultations);
  } catch (error) {
    console.error("❌ Fetch Error:", error);
    res.status(500).json({ message: "Error fetching consultations" });
  }
};
