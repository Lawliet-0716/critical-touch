const Emergency = require("../models/Emergency");
const Driver = require("../models/Driver");

// 🔥 ADDED
const Patient = require("../models/Patient");
const Hospital = require("../models/Hospital");
const { sendSOS } = require("../services/smsService");

// 🧠 Distance helper (Haversine formula)
const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// =======================
// 🧑‍⚕️ CREATE EMERGENCY
// =======================
exports.createEmergency = async (req, res) => {
  try {
    const { lat, lng, emergencyType } = req.body;

    const emergency = await Emergency.create({
      patient: req.user.id,
      location: { lat, lng },
      emergencyType,
      status: "pending",
    });

    // 🔥 SEND SMS (FIXED ONLY THIS PART)
    let patient = null;
    try {
      patient = await Patient.findById(req.user.id);

      if (patient?.emergencyContact) {
        const locationLink = `https://www.google.com/maps?q=${lat},${lng}`;

        const message = `🚨 EMERGENCY ALERT 🚨
Patient: ${patient.firstName}
Location: ${locationLink}
Immediate help needed!`;

        await sendSOS({
          to: `+91${patient.emergencyContact}`,
          message,
        });

        console.log("📩 SOS SMS sent");
      }
    } catch (smsError) {
      console.error("❌ SMS failed:", smsError.message);
    }

    const io = req.app.get("io");

    // 🏥 notify nearest hospital (for HospitalDashboard)
    try {
      const hospitals = await Hospital.find().select("hospitalName location");
      let nearestHospital = null;
      let minDistance = Infinity;

      for (const hospital of hospitals) {
        if (!hospital?.location) continue;
        const [hLat, hLng] = hospital.location.split(",").map(Number);
        if (!Number.isFinite(hLat) || !Number.isFinite(hLng)) continue;

        const d = getDistance(lat, lng, hLat, hLng);
        if (d < minDistance) {
          minDistance = d;
          nearestHospital = hospital;
        }
      }

      if (nearestHospital && io) {
        io.to(`hospital_${nearestHospital._id.toString()}`).emit("newEmergency", {
          // keep payload shape compatible with existing HospitalDashboard
          booking: {
            location: { lat, lng },
            patientName: patient?.firstName || "Patient",
            condition: emergencyType || "Emergency",
            vehicleType: "SOS",
            patientId: req.user.id,
          },
          hospital: nearestHospital,
          distance: minDistance,
          emergency: {
            _id: emergency._id,
            patient: emergency.patient,
            location: emergency.location,
            emergencyType: emergency.emergencyType,
            status: emergency.status,
            createdAt: emergency.createdAt,
          },
        });
      }
    } catch (hospitalError) {
      console.error("❌ Hospital notify failed:", hospitalError.message);
    }

    // 🔥 GET ALL AVAILABLE DRIVERS
    const drivers = await Driver.find({ isAvailable: true });

    // 🔥 FILTER DRIVERS WITH LOCATION
    const driversWithLocation = drivers.filter(
      (d) => d.location && d.location.lat && d.location.lng,
    );

    // 🔥 SORT BY DISTANCE
    const sortedDrivers = driversWithLocation
      .map((driver) => ({
        driver,
        distance: getDistance(
          lat,
          lng,
          driver.location.lat,
          driver.location.lng,
        ),
      }))
      .sort((a, b) => a.distance - b.distance);

    // 🔥 PICK TOP 3 NEAREST
    const nearestDrivers = sortedDrivers.slice(0, 3);

    if (nearestDrivers.length > 0) {
      nearestDrivers.forEach(({ driver }) => {
        io.to(driver._id.toString()).emit("newEmergency", emergency);
      });
    } else {
      // 🚨 fallback
      io.to("driver").emit("newEmergency", emergency);
    }

    res.status(201).json({
      success: true,
      emergency,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// 🚑 GET PENDING REQUESTS
// =======================
exports.getPendingEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({ status: "pending" }).populate(
      "patient",
      "firstName lastName phone",
    );

    res.status(200).json({
      success: true,
      count: emergencies.length,
      emergencies,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// 🚑 ACCEPT EMERGENCY
// =======================
exports.acceptEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }

    if (emergency.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Already taken",
      });
    }

    emergency.status = "accepted";
    emergency.driver = req.user.id;

    await emergency.save();

    const io = req.app.get("io");

    // 🚀 notify patient
    io.to(emergency.patient.toString()).emit("emergencyAccepted", emergency);

    // 🔥 notify other drivers
    io.to("driver").emit("emergencyTaken", emergency._id);

    res.status(200).json({
      success: true,
      emergency,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// 🏁 COMPLETE EMERGENCY / TRIP
// =======================
exports.completeEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }

    if (!emergency.driver || emergency.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only assigned driver can complete the trip",
      });
    }

    if (emergency.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Trip is not in progress",
      });
    }

    emergency.status = "completed";
    await emergency.save();

    // If this came from a pre-booking, complete that too
    try {
      if (emergency.preBooking) {
        const PreBooking = require("../models/PreBooking");
        await PreBooking.findByIdAndUpdate(emergency.preBooking, {
          status: "completed",
        });
      }
    } catch (err) {
      console.error("PreBooking completion failed:", err.message);
    }

    const io = req.app.get("io");
    if (io) {
      io.to(emergency.patient.toString()).emit("tripEnded", {
        emergencyId: emergency._id.toString(),
      });
      io.to(emergency.driver.toString()).emit("tripEnded", {
        emergencyId: emergency._id.toString(),
      });

      // 🔥 also clear any active police alert map for this ambulance/driver
      // Police clients only hide the map on "ambulance_left". If the trip ends,
      // the driver may stop sending location updates, so police would never
      // receive an "ambulance_left" naturally.
      io.to("police").emit("ambulance_left", {
        driverId: emergency.driver.toString(),
        reason: "tripEnded",
        emergencyId: emergency._id.toString(),
      });

      // 🏥 let hospitals clear their emergency UI
      // (HospitalDashboard listens for "emergencyEnded")
      io.to("hospital").emit("emergencyEnded", {
        emergencyId: emergency._id.toString(),
        driverId: emergency.driver.toString(),
      });
    }

    res.status(200).json({
      success: true,
      emergency,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
