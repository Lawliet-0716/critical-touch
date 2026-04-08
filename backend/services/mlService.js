const axios = require("axios");

// 🔐 Load from .env
const ML_BASE_URL = process.env.ML_BASE_URL;

exports.getAISuggestion = async (text) => {
  try {
    const response = await axios.post(`${ML_BASE_URL}/predict`, {
      text,
    });

    return {
      ...response.data,
      sos_trigger: response.data.sos_trigger || false,
    };
  } catch (error) {
    console.error("ML Service Error:", error.message);
    throw new Error("AI service failed");
  }
};
