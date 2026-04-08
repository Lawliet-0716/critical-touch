const mongoose = require("mongoose");

// 👨‍⚕️ Doctor Schema
const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  specialty: {
    type: String,
    required: true,
  },
  availableSlots: [
    {
      type: String,
    },
  ],
});

const hospitalSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
    },

    contactNumber: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Contact number must be 10 digits"],
    },

    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email"],
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      default: "hospital",
    },

    // ✅ NEW FIELDS (ADDED SAFELY)

    specialties: [
      {
        type: String,
      },
    ],

    doctors: [doctorSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Hospital", hospitalSchema);
