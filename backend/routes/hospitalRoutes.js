const express = require("express");
const router = express.Router();

const {
  hospitalSignup,
  hospitalSignin,
  updateHospital,
  searchHospital,
  getSpecialties,
  getDoctorsBySpecialty,
} = require("../controllers/hospitalController");
const { protect, authorize } = require("../middleware/protect");
const Hospital = require("../models/Hospital");

// =======================
// PUBLIC ROUTES
// =======================
router.post("/signup", hospitalSignup);
router.post("/signin", hospitalSignin);
router.get("/search", searchHospital);
router.get("/:id/specialties", getSpecialties);
router.get("/:id/doctors", getDoctorsBySpecialty);

// =======================
// PROTECTED ROUTE
// =======================
router.get("/me", protect, authorize("hospital"), async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.user.id).select(
      "hospitalName location contactNumber email specialties doctors role",
    );

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    res.json({
      success: true,
      hospital,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/update", protect, authorize("hospital"), updateHospital);

module.exports = router;
