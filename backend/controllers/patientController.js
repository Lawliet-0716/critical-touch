const Patient = require("../models/Patient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 🔐 Load from .env
const JWT_SECRET = process.env.JWT_SECRET;

// 🔐 Generate Token
const generateToken = (id) => {
  return jwt.sign({ id, role: "patient" }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

// 🆔 Generate UHID
const generateUHID = () => {
  return "UHID" + Math.floor(100000 + Math.random() * 900000);
};

// =======================
// ✅ PATIENT SIGNUP
// =======================
exports.patientSignup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      age,
      gender,
      bloodGroup,
      phone,
      emergencyContact,
      email,
      password,
    } = req.body;

    const existingUser = await Patient.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Patient already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const uhid = generateUHID();

    const patient = await Patient.create({
      uhid,
      firstName,
      lastName,
      age,
      gender,
      bloodGroup,
      phone,
      emergencyContact,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Patient registered successfully ✅",
      token: generateToken(patient._id),
      patient,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// ✅ PATIENT SIGNIN
// =======================
exports.patientSignin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // 🔍 Find by email OR uhid
    const patient = await Patient.findOne({
      $or: [{ email: identifier }, { uhid: identifier }],
    });

    if (!patient) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, patient.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful ✅",
      token: generateToken(patient._id),
      patient,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
