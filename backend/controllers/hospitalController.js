const Hospital = require("../models/Hospital");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 🔐 Load from .env
const JWT_SECRET = process.env.JWT_SECRET;

// =======================
// 🔑 GENERATE TOKEN
// =======================
const generateToken = (id) => {
  return jwt.sign({ id, role: "hospital" }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

// =======================
// ✅ HOSPITAL SIGNUP
// =======================
exports.hospitalSignup = async (req, res) => {
  try {
    const { hospitalName, location, contactNumber, email, password } = req.body;

    const existingHospital = await Hospital.findOne({ email });
    if (existingHospital) {
      return res.status(400).json({ message: "Hospital already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const hospital = await Hospital.create({
      hospitalName,
      location,
      contactNumber,
      email,
      password: hashedPassword,
      specialties: [],
      doctors: [],
    });

    res.status(201).json({
      message: "Hospital registered successfully 🏥",
      token: generateToken(hospital._id),
      hospital,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// ✅ HOSPITAL SIGNIN
// =======================
exports.hospitalSignin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const hospital = await Hospital.findOne({ email });

    if (!hospital) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, hospital.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful 🏥",
      token: generateToken(hospital._id),
      hospital,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// ✅ UPDATE HOSPITAL
// =======================
exports.updateHospital = async (req, res) => {
  try {
    const hospitalId = req.user.id;

    const { specialties, doctors } = req.body;

    const hospital = await Hospital.findById(hospitalId);

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    if (specialties) hospital.specialties = specialties;
    if (doctors) hospital.doctors = doctors;

    await hospital.save();

    res.status(200).json({
      message: "Hospital updated successfully ✅",
      hospital,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// 🔥 FIXED: SEARCH HOSPITAL (MULTIPLE)
// =======================
exports.searchHospital = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: "Search query required" });
    }

    const hospitals = await Hospital.find({
      hospitalName: { $regex: name, $options: "i" },
    }).select("hospitalName location specialties");

    if (!hospitals.length) {
      return res.status(404).json({ message: "No hospitals found" });
    }

    res.json(hospitals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// ✅ GET SPECIALTIES
// =======================
exports.getSpecialties = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    res.json(hospital.specialties || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// ✅ GET DOCTORS BY SPECIALTY
// =======================
exports.getDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialty } = req.query;

    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    const doctors = (hospital.doctors || []).filter(
      (doc) =>
        doc.specialty &&
        doc.specialty.toLowerCase() === specialty.toLowerCase(),
    );

    res.json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
