const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    uhid: {
      type: String,
      unique: true,
      required: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      required: true,
      min: 0,
    },

    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },

    bloodGroup: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Phone number must be exactly 10 digits"],
    },

    emergencyContact: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Emergency contact must be exactly 10 digits"],
    },

    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Patient", patientSchema);
