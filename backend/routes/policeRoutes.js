const express = require("express");
const router = express.Router();

const {
  policeSignup,
  policeSignin,
} = require("../controllers/policeController");
const { protect } = require("../middleware/protect");

// PUBLIC
router.post("/signup", policeSignup);
router.post("/signin", policeSignin);

// PROTECTED
router.get("/me", protect, (req, res) => {
  res.json({
    message: "Police is authenticated 🚓",
    user: req.user,
  });
});

module.exports = router;
