const twilio = require("twilio");

// 🔐 Load from .env
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

exports.sendSOS = async ({ to, message }) => {
  try {
    const res = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to,
    });

    console.log("📩 SMS sent:", res.sid);
  } catch (error) {
    console.error("❌ SMS error:", error.message);
  }
};
