const PreBooking = require("../models/PreBooking");
const Emergency = require("../models/Emergency");

// =======================
// ✅ CREATE PRE-BOOKING
// =======================
exports.createPreBooking = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, vehicleType, scheduledAt } = req.body;

    // basic validation
    if (!pickupLocation || !dropLocation || !vehicleType || !scheduledAt) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const booking = await PreBooking.create({
      patient: req.user.id,
      pickupLocation,
      dropLocation,
      vehicleType,
      scheduledAt,
    });

    res.status(201).json({
      message: "Pre-booking successful",
      booking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Pre-booking failed" });
  }
};

// =======================
// 🚑 DRIVER: GET DISPATCHED BOOKINGS
// =======================
exports.getDispatchedBookings = async (req, res) => {
  try {
    const bookings = await PreBooking.find({
      status: "dispatched",
    })
      .populate("patient", "firstName lastName phone")
      .sort({ scheduledAt: 1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching dispatched bookings" });
  }
};

// =======================
// ✅ DRIVER: ACCEPT PRE-BOOKING (creates Emergency)
// =======================
exports.acceptPreBooking = async (req, res) => {
  try {
    const booking = await PreBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Pre-booking not found",
      });
    }

    if (booking.status !== "dispatched") {
      return res.status(400).json({
        success: false,
        message: "Pre-booking is not available",
      });
    }

    booking.status = "accepted";
    booking.driver = req.user.id;
    await booking.save();

    const emergency = await Emergency.create({
      patient: booking.patient,
      driver: req.user.id,
      status: "accepted",
      location: {
        lat: booking.pickupLocation?.lat,
        lng: booking.pickupLocation?.lng,
      },
      destination: {
        address: booking.dropLocation?.address,
        lat: booking.dropLocation?.lat,
        lng: booking.dropLocation?.lng,
      },
      preBooking: booking._id,
      emergencyType: `PreBooking (${booking.vehicleType})`,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(booking.patient.toString()).emit("emergencyAccepted", emergency);
      io.to("driver").emit("preBookingTaken", booking._id.toString());
    }

    res.status(200).json({
      success: true,
      booking,
      emergency,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// ❌ PATIENT: CANCEL PRE-BOOKING
// =======================
exports.cancelPreBooking = async (req, res) => {
  try {
    const booking = await PreBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Pre-booking not found",
      });
    }

    if (booking.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!["pending", "dispatched"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel after driver acceptance",
      });
    }

    booking.status = "cancelled";
    await booking.save();

    const io = req.app.get("io");
    if (io) {
      io.to("driver").emit("preBookingCancelled", booking._id.toString());
      io.to(booking.patient.toString()).emit("preBookingCancelled", {
        id: booking._id.toString(),
      });
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// ✅ GET MY BOOKINGS
// =======================
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await PreBooking.find({
      patient: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};
