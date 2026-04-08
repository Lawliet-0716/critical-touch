const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Phone must be 10 digits"],
    },

    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{8}$/, "License number must be 8 digits"], // ✅ ADDED
    },

    ambulanceNumber: {
      type: String,
      required: true,
    },

    // 🚑 Existing field
    ambulanceType: {
      type: String,
      enum: ["BASIC", "ADVANCED", "ICU"],
      required: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
    },

    role: {
      type: String,
      default: "driver",
    },

    // =========================
    // ✅ NEW FEATURES (ADDED)
    // =========================

    isAvailable: {
      type: Boolean,
      default: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0],
      },
    },
  },
  { timestamps: true },
);

// ✅ Required for geo queries (nearest driver)
driverSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Driver", driverSchema);
