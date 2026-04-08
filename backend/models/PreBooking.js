const mongoose = require("mongoose");

const preBookingSchema = new mongoose.Schema(
  {
    // 👤 Patient (auto from login)
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    // 📍 Pickup Location
    pickupLocation: {
      address: String,
      lat: Number,
      lng: Number,
    },

    // 📍 Drop Location
    dropLocation: {
      address: String,
      lat: Number,
      lng: Number,
    },

    // 🚑 Vehicle Type
    vehicleType: {
      type: String,
      enum: ["BASIC", "ICU", "ADVANCED"],
      required: true,
    },

    // ⏰ Scheduled Time
    scheduledAt: {
      type: Date,
      required: true,
    },

    // 📊 Status
    status: {
      type: String,
      enum: ["pending", "dispatched", "accepted", "completed", "cancelled"],
      default: "pending",
    },

    // 🚑 Assigned Driver (once accepted)
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PreBooking", preBookingSchema);
