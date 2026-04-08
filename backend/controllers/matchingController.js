// controllers/matchingController.js

const Driver = require("../models/Driver");
const PreBooking = require("../models/PreBooking");
const Hospital = require("../models/Hospital");
const Patient = require("../models/Patient");

// =======================
// 📍 DISTANCE FUNCTION
// =======================
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// =======================
// 🚑 FIND MATCHING DRIVERS
// =======================
exports.findMatchingDrivers = async (booking, io) => {
  try {
    // =======================
    // 1️⃣ FIND DRIVERS
    // =======================
    const drivers = await Driver.find({
      ambulanceType: booking.vehicleType,
      isAvailable: true,
    });

    // =======================
    // 2️⃣ FIND NEAREST HOSPITAL
    // =======================
    const hospitals = await Hospital.find();

    let nearestHospital = null;
    let minDistance = Infinity;

    const origin = booking?.pickupLocation || booking?.location;
    if (!origin || typeof origin.lat !== "number" || typeof origin.lng !== "number") {
      console.warn("⚠️ Booking missing pickup coordinates:", booking?._id);
    }

    hospitals.forEach((hospital) => {
      if (!hospital.location) return;

      const [lat, lng] = hospital.location.split(",").map(Number);

      const distance = getDistance(
        origin?.lat,
        origin?.lng,
        lat,
        lng,
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestHospital = hospital;
      }
    });

    // =======================
    // 3️⃣ EMIT TO HOSPITAL
    // =======================
    if (nearestHospital && io) {
      console.log("🏥 Nearest hospital:", nearestHospital._id);

      let patient = null;
      try {
        if (booking?.patient) {
          patient = await Patient.findById(booking.patient).select(
            "uhid firstName lastName",
          );
        }
      } catch {
        // ignore
      }

      io.to(`hospital_${nearestHospital._id}`).emit("newEmergency", {
        booking: {
          ...booking,
          patientName: patient
            ? `${patient.firstName} ${patient.lastName}`.trim()
            : booking?.patientName,
          uhid: patient?.uhid,
          location: booking?.pickupLocation || booking?.location,
        },
        hospital: nearestHospital,
        distance: minDistance,
      });
    }

    return drivers;
  } catch (error) {
    console.error("Matching error:", error);
    return [];
  }
};
