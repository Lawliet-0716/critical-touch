const express = require("express");
const router = express.Router();

const {
  patientSignup,
  patientSignin,
} = require("../controllers/patientController");
const { protect, authorize } = require("../middleware/protect");
const Patient = require("../models/Patient");

// =======================
// PUBLIC ROUTES
// =======================
router.post("/signup", patientSignup);
router.post("/signin", patientSignin);

// =======================
// PROTECTED ROUTE
// =======================
router.get("/me", protect, (req, res) => {
  // Return full patient profile for dashboards (name, UHID, etc.)
  Patient.findById(req.user.id)
    .select("uhid firstName lastName age gender bloodGroup phone emergencyContact role")
    .then((patient) => {
      if (!patient) return res.status(404).json({ message: "Patient not found" });
      res.json({ success: true, patient });
    })
    .catch((err) => res.status(500).json({ message: err.message }));
});

// =======================
// ✅ UPDATE PATIENT PROFILE
// =======================
router.put("/update", protect, authorize("patient"), async (req, res) => {
  try {
    const allowed = [
      "firstName",
      "lastName",
      "age",
      "gender",
      "bloodGroup",
      "phone",
      "emergencyContact",
    ];
    const updates = {};
    for (const key of allowed) {
      if (typeof req.body?.[key] !== "undefined") updates[key] = req.body[key];
    }

    const patient = await Patient.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("uhid firstName lastName age gender bloodGroup phone emergencyContact role");

    if (!patient) return res.status(404).json({ message: "Patient not found" });

    res.json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
