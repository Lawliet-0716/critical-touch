const mongoose = require("mongoose");

const policeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    badgeNumber: {
      type: String,
      required: true,
      unique: true,
    },

    station: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Phone must be 10 digits"],
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      default: "police",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Police", policeSchema);
