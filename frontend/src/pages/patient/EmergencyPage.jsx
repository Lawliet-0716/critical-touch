import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PatientMap from "../../components/maps/PatientMap";
import socket from "../../socket/socket";

export default function EmergencyPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const stored = localStorage.getItem("emergency");
  const initialEmergency =
    state?.emergency || (stored ? JSON.parse(stored) : null);

  const [emergency, setEmergency] = useState(initialEmergency);
  const [driverLocation, setDriverLocation] = useState(null);
  const [status, setStatus] = useState(initialEmergency?.status || "waiting");
  const [arrived, setArrived] = useState(false);

  // 🔥 NEW: trip state from socket
  const [tripStarted, setTripStarted] = useState(false);

  // 🔌 CONNECT SOCKET
  useEffect(() => {
    if (!socket.connected) socket.connect();
  }, []);

  // 🔑 JOIN ROOM
  useEffect(() => {
    if (emergency) {
      socket.emit("join", {
        userId: emergency.patient,
        role: "patient",
      });
    }
  }, [emergency]);

  // persist emergency for reloads/navigation
  useEffect(() => {
    if (emergency?._id) {
      try {
        localStorage.setItem("emergency", JSON.stringify(emergency));
      } catch {
        // ignore
      }
    }
  }, [emergency]);

  // 🚑 DRIVER ACCEPTED
  useEffect(() => {
    const handler = (data) => {
      setEmergency(data);
      setStatus("accepted");
    };

    socket.on("emergencyAccepted", handler);

    return () => socket.off("emergencyAccepted", handler);
  }, []);

  // 📍 DRIVER LOCATION
  useEffect(() => {
    const handler = (loc) => {
      setDriverLocation(loc);
    };

    socket.on("driver_location_update", handler);

    return () => socket.off("driver_location_update", handler);
  }, []);

  // 📏 ARRIVAL (<= 500m)
  useEffect(() => {
    if (status !== "accepted") return;
    if (!driverLocation || !emergency?.location) return;

    const toRad = (x) => (x * Math.PI) / 180;
    const haversineKm = (a, b) => {
      const R = 6371;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);
      const h =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) *
          Math.cos(lat2) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    };

    const km = haversineKm(emergency.location, driverLocation);
    if (km <= 0.5) setArrived(true);
  }, [driverLocation, emergency, status]);

  // 🔥 SOCKET: TRIP STARTED (IMPORTANT)
  useEffect(() => {
    const handler = () => {
      setTripStarted(true);
    };

    socket.on("tripStarted", handler);

    return () => socket.off("tripStarted", handler);
  }, []);

  // 🏁 TRIP ENDED → back to dashboard
  useEffect(() => {
    const handler = () => {
      localStorage.removeItem("emergency");
      navigate("/patient/dashboard");
    };

    socket.on("tripEnded", handler);
    return () => socket.off("tripEnded", handler);
  }, [navigate]);

  if (!emergency) {
    return <p className="p-6">No emergency found</p>;
  }

  // 🔥 AFTER PICKUP → HOLD SCREEN
  if (tripStarted) {
    return (
      <div className="flex items-center justify-center h-screen bg-green-50 text-center px-6">
        <div>
          <h1 className="text-2xl font-bold text-green-700 mb-3">
            🚑 Help is on the way!
          </h1>

          <p className="text-gray-700 text-lg">
            You are now heading to the hospital.
          </p>

          <p className="text-sm text-gray-500 mt-2">
            Stay calm, you're in safe hands ❤️
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* 🔥 STATUS */}
      <div className="bg-white p-4 rounded-xl shadow mb-4 text-center">
        {status === "waiting" && (
          <p className="text-yellow-600 font-semibold">
            ⏳ Searching for nearest driver...
          </p>
        )}

        {status === "accepted" && (
          <p className="text-green-600 font-semibold">
            {arrived ? "✅ Driver has arrived" : "🚑 Driver is on the way!"}
          </p>
        )}
      </div>

      {/* 🔥 MAP */}
      {status === "accepted" && (
        <PatientMap
          patientLocation={emergency.location}
          driverLocation={driverLocation}
        />
      )}
    </div>
  );
}
