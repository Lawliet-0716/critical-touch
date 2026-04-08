const express = require("express");
const router = express.Router();
const { getSuggestion } = require("../controllers/aiController");

router.post("/suggest", getSuggestion);

module.exports = router;
