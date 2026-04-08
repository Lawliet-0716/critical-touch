const express = require("express");
const router = express.Router();

const {
  patientSignup,
  patientSignin,
} = require("../controllers/patientController");
const { protect } = require("../middleware/protect");

// =======================
// PUBLIC ROUTES
// =======================
router.post("/signup", patientSignup);
router.post("/signin", patientSignin);

// =======================
// PROTECTED ROUTE
// =======================
router.get("/me", protect, (req, res) => {
  res.json({
    message: "Patient is authenticated ✅",
    user: req.user,
  });
});

module.exports = router;
