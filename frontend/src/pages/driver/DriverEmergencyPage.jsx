import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DriverMap from "../../components/maps/DriverMap";
import DriverHospitalMap from "../../components/maps/DriverHospitalMap";
import socket from "../../socket/socket";
import api from "../../services/api";

export default function DriverEmergencyPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const stored = localStorage.getItem("emergency");
  const emergency = state?.emergency || (stored ? JSON.parse(stored) : null);

  const [driverLocation, setDriverLocation] = useState(null);

  // 🔥 NEW: trip state (NO localStorage)
  const [tripStarted, setTripStarted] = useState(false);

  // 🔌 CONNECT SOCKET
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  // 📍 TRACK LOCATION
  useEffect(() => {
    if (!emergency) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setDriverLocation(loc);

        socket.emit("driver_location_update", {
          driverId: emergency.driver,
          patientId: emergency.patient,
          location: loc,
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [emergency]);

  if (!emergency) return <p>No emergency found</p>;

  // 🔥 HANDLE PICKUP
  const handlePickup = () => {
    setTripStarted(true);

    socket.emit("patient_picked", {
      patientId: emergency.patient,
    });
  };

  const handleEndTrip = async () => {
    if (!emergency?._id) return;

    try {
      await api.put(`/emergency/${emergency._id}/complete`);
      // Ensure police tracking is cleared immediately (server-side caches)
      socket.emit("trip_ended", {
        driverId: emergency.driver,
      });
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem("emergency");
      navigate("/driver/dashboard");
    }
  };

  // 🔥 AFTER PICKUP → HOSPITAL MODE
  if (tripStarted) {
    return (
      <div style={{ position: "relative" }}>
        <DriverHospitalMap destination={emergency?.destination} />

        <button
          onClick={handleEndTrip}
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 20px",
            background: "#0f172a",
            color: "white",
            borderRadius: "10px",
            fontWeight: "bold",
            zIndex: 1000,
          }}
        >
          🏁 End Trip
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-3">🚑 Navigating to Patient...</h2>

      {driverLocation && (
        <DriverMap
          driverLocation={driverLocation}
          patientLocation={emergency.location}
        />
      )}

      {/* 🔥 PICKUP BUTTON */}
      <button
        onClick={handlePickup}
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "12px 20px",
          background: "#16a34a",
          color: "white",
          borderRadius: "10px",
          fontWeight: "bold",
          zIndex: 1000,
        }}
      >
        🚑 Patient Picked Up
      </button>
    </div>
  );
}
