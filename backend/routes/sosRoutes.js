const express = require("express");
const router = express.Router();

const { sendSOSController } = require("../controllers/sosController");
const { protect } = require("../middleware/protect");

router.post("/send", protect, sendSOSController);

module.exports = router;
