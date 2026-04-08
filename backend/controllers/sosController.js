const Patient = require("../models/Patient");
const { sendSOS } = require("../services/smsService");

exports.sendSOSController = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    const patient = await Patient.findById(req.user.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const emergencyContact = patient.emergencyContact;

    const locationLink = `https://www.google.com/maps?q=${lat},${lng}`;

    const message = `🚨 EMERGENCY ALERT 🚨
Patient: ${patient.firstName}
Location: ${locationLink}
Immediate help needed!`;

    await sendSOS({
      to: `+91${emergencyContact}`,
      message,
    });

    res.json({ message: "SOS sent successfully 🚑" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send SOS" });
  }
};
