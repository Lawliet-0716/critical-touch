const { getAISuggestion } = require("../services/mlService");

exports.getSuggestion = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }

    const result = await getAISuggestion(text);

    // ✅ Ensure sos_trigger always exists
    res.json({
      ...result,
      sos_trigger: result.sos_trigger || false,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "AI request failed" });
  }
};
