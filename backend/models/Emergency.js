const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "cancelled"],
      default: "pending",
    },

    location: {
      lat: Number,
      lng: Number,
    },

    // 🏥 Optional destination (for pre-bookings)
    destination: {
      address: String,
      lat: Number,
      lng: Number,
    },

    // 🔗 Link back to pre-booking (if created from one)
    preBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PreBooking",
      default: null,
    },

    emergencyType: {
      type: String, // accident, heart attack, etc.
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Emergency", emergencySchema);
