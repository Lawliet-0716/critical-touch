const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema(
  {
    // 👤 PATIENT
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    // 🏥 HOSPITAL
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    // 👨‍⚕️ DOCTOR (embedded reference info)
    doctor: {
      name: String,
      specialty: String,
    },

    // 🕒 TIME SLOT
    scheduledAt: {
      type: String, // better for slots like "10:00 AM"
      required: true,
    },

    // 📊 STATUS
    status: {
      type: String,
      enum: ["booked", "accepted", "completed", "cancelled"],
      default: "booked",
    },

    // 🎥 VIDEO ROOM
    roomId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Consultation", consultationSchema);
