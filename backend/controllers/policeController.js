const Police = require("../models/Police");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 🔐 Hardcoded Secret
const JWT_SECRET = process.env.JWT_SECRET;

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id, role: "police" }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

// =======================
// ✅ POLICE SIGNUP
// =======================
exports.policeSignup = async (req, res) => {
  try {
    const { name, badgeNumber, station, phone, password } = req.body;

    const existingPolice = await Police.findOne({ badgeNumber });
    if (existingPolice) {
      return res.status(400).json({ message: "Police already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const police = await Police.create({
      name,
      badgeNumber,
      station,
      phone,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Police registered successfully 🚓",
      token: generateToken(police._id),
      police,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// ✅ POLICE SIGNIN
// =======================
exports.policeSignin = async (req, res) => {
  try {
    const { badgeNumber, password } = req.body;

    const police = await Police.findOne({ badgeNumber });

    if (!police) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, police.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful 🚓",
      token: generateToken(police._id),
      police,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
