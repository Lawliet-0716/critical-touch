// =======================
// 🔐 LOAD ENV FIRST
// =======================
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// CONFIG
const connectDB = require("./config/db");

// ROUTES
const patientRoutes = require("./routes/patientRoutes");
const driverRoutes = require("./routes/driverRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");
const policeRoutes = require("./routes/policeRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const preBookingRoutes = require("./routes/preBookingRoutes");
const sosRoutes = require("./routes/sosRoutes");
const aiRoutes = require("./routes/aiRoutes");
const matchingRoutes = require("./routes/matchingRoutes");

// CRON
const startPreBookingCron = require("./cron/preBooking");

const app = express();

// =======================
// ✅ CONNECT DATABASE
// =======================
connectDB();

// =======================
// ✅ MIDDLEWARE
// =======================
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
  }),
);

app.use(express.json());

// =======================
// ✅ ROUTES
// =======================
app.use("/api/auth/patient", patientRoutes);
app.use("/api/auth/driver", driverRoutes);
app.use("/api/auth/hospital", hospitalRoutes);
app.use("/api/auth/police", policeRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/prebooking", preBookingRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/video", require("./routes/videoRoutes"));
app.use("/api/consultation", require("./routes/consultationRoutes"));
app.use("/api/matching", matchingRoutes);

// =======================
// ✅ TEST ROUTE
// =======================
app.get("/", (req, res) => {
  res.send("🚑 Smart Emergency Backend Running...");
});

// =======================
// ❌ GLOBAL ERROR HANDLER
// =======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// =======================
// 🚓 GLOBAL TRACKING
// =======================
const policeLocations = {};
const ambulanceLocations = {};
const proximityState = {};

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
// 🔥 SOCKET.IO SETUP
// =======================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
  },
});

app.set("io", io);

// =======================
// 🔥 START CRON
// =======================
startPreBookingCron(io);

// =======================
// 🔌 SOCKET CONNECTION
// =======================
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  // 🔑 JOIN ROOMS
  socket.on("join", ({ userId, role }) => {
    socket.join(role);
    socket.join(userId);

    if (role === "hospital") {
      socket.join(`hospital_${userId}`);
      console.log(`🏥 Hospital joined room hospital_${userId}`);
    }

    if (role === "driver") {
      socket.join("driver");
    }

    console.log(`User ${userId} joined as ${role}`);
  });

  // 🧪 TEST HOSPITAL EVENT
  socket.on("test_hospital", ({ hospitalId }) => {
    io.to(`hospital_${hospitalId}`).emit("test_message", {
      msg: "🚑 Test message to hospital",
    });
  });

  // 📍 DRIVER LOCATION UPDATE
  socket.on("driver_location_update", ({ driverId, patientId, location }) => {
    io.to(patientId).emit("driver_location_update", location);

    ambulanceLocations[driverId] = location;

    Object.entries(policeLocations).forEach(([policeId, police]) => {
      const distance = getDistance(
        location.lat,
        location.lng,
        police.lat,
        police.lng,
      );

      if (!proximityState[policeId]) proximityState[policeId] = {};
      const wasNearby = Boolean(proximityState[policeId][driverId]);

      if (distance <= 0.7) {
        if (!wasNearby) {
          proximityState[policeId][driverId] = true;

          io.to(police.socketId).emit("ambulance_nearby", {
            driverId,
            ambulanceLocation: location,
            distance: distance.toFixed(2),
          });
        }
      } else {
        if (wasNearby) {
          proximityState[policeId][driverId] = false;
          io.to(police.socketId).emit("ambulance_left", { driverId });
        }
      }
    });
  });

  // 🚑 PATIENT PICKED
  socket.on("patient_picked", ({ patientId }) => {
    io.to(patientId).emit("tripStarted");
  });

  // 🚓 POLICE LOCATION UPDATE
  socket.on("police_location_update", ({ policeId, location }) => {
    policeLocations[policeId] = {
      lat: location.lat,
      lng: location.lng,
      socketId: socket.id,
    };

    Object.entries(ambulanceLocations).forEach(([driverId, ambLoc]) => {
      const distance = getDistance(
        ambLoc.lat,
        ambLoc.lng,
        location.lat,
        location.lng,
      );

      if (!proximityState[policeId]) proximityState[policeId] = {};
      const wasNearby = Boolean(proximityState[policeId][driverId]);

      if (distance <= 0.7) {
        if (!wasNearby) {
          proximityState[policeId][driverId] = true;
          io.to(socket.id).emit("ambulance_nearby", {
            driverId,
            ambulanceLocation: ambLoc,
            distance: distance.toFixed(2),
          });
        }
      } else if (wasNearby) {
        proximityState[policeId][driverId] = false;
        io.to(socket.id).emit("ambulance_left", { driverId });
      }
    });
  });

  // ❌ DISCONNECT
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);

    for (const id in policeLocations) {
      if (policeLocations[id].socketId === socket.id) {
        delete policeLocations[id];
        delete proximityState[id];
      }
    }
  });
});

// =======================
// 🚀 START SERVER
// =======================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
