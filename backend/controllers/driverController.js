const Driver = require("../models/Driver");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 🔐 Load from .env
const JWT_SECRET = process.env.JWT_SECRET;

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id, role: "driver" }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

// =======================
// ✅ DRIVER SIGNUP
// =======================
exports.driverSignup = async (req, res) => {
  try {
    const {
      name,
      phone,
      licenseNumber,
      ambulanceNumber,
      password,
      ambulanceType,
    } = req.body;

    const existingDriver = await Driver.findOne({ licenseNumber });
    if (existingDriver) {
      return res.status(400).json({ message: "Driver already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const driver = await Driver.create({
      name,
      phone,
      licenseNumber,
      ambulanceNumber,
      password: hashedPassword,
      ambulanceType,
    });

    res.status(201).json({
      message: "Driver registered successfully 🚑",
      token: generateToken(driver._id),
      driver,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// ✅ DRIVER SIGNIN
// =======================
exports.driverSignin = async (req, res) => {
  try {
    const { licenseNumber, password } = req.body;

    const driver = await Driver.findOne({ licenseNumber });

    if (!driver) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, driver.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful 🚑",
      token: generateToken(driver._id),
      driver,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// 📍 UPDATE DRIVER LOCATION
// =======================
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      req.user.id,
      {
        location: {
          type: "Point",
          coordinates: [lng, lat], // ⚠️ IMPORTANT: [lng, lat]
        },
      },
      { new: true },
    );

    res.json({
      message: "Location updated",
      location: driver.location,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating location" });
  }
};
