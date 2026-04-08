import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../../socket/socket";
import DriverHospitalMap from "../../components/maps/DriverHospitalMap";
import AppointmentCard from "../../components/AppointmentCard";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

export default function HospitalDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 🚑 Emergency state
  const [emergency, setEmergency] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState(null);

  // 📹 Consultation state
  const [consultations, setConsultations] = useState([]);

  // =======================
  // 🔌 SOCKET CONNECTION
  // =======================
  useEffect(() => {
    const hospitalId = user?.id || user?._id;
    if (!hospitalId) return;

    if (!socket.connected) socket.connect();

    socket.emit("join", {
      userId: hospitalId,
      role: "hospital",
    });

    // =======================
    // 🚑 EMERGENCY EVENTS
    // =======================
    socket.on("newEmergency", (data) => {
      console.log("🚑 Emergency received:", data);

      setEmergency(data);

      if (data.booking?.location) {
        setDriverLocation(data.booking.location);
      }
    });

    socket.on("ambulanceUpdate", (data) => {
      setDriverLocation(data.location);
      setEta(data.eta);
    });

    socket.on("emergencyEnded", () => {
      setEmergency(null);
      setDriverLocation(null);
      setEta(null);
    });

    // =======================
    // 📹 CONSULTATION EVENTS
    // =======================
    socket.on("newConsultation", (data) => {
      console.log("📹 New consultation:", data);

      setConsultations((prev) => [data.consultation || data, ...prev]);
    });

    socket.on("consultationCompleted", (data) => {
      setConsultations((prev) => prev.filter((c) => c._id !== data._id));
    });

    return () => {
      socket.off("newEmergency");
      socket.off("ambulanceUpdate");
      socket.off("emergencyEnded");
      socket.off("newConsultation");
      socket.off("consultationCompleted");
    };
  }, [user]);

  // =======================
  // 📥 FETCH CONSULTATIONS
  // =======================
  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const res = await api.get("/consultation/all");
        setConsultations(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchConsultations();
  }, []);

  // =======================
  // 🩺 ACCEPT CONSULTATION
  // =======================
  const acceptConsultation = async (id) => {
    try {
      await api.put(`/consultation/accept/${id}`);

      const res = await api.get("/consultation/all");
      setConsultations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      {/* ======================= */}
      {/* HEADER */}
      {/* ======================= */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🏥 Hospital Dashboard</h1>

        <button
          onClick={() => navigate("/hospital/edit")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Edit Hospital
        </button>
      </div>

      {/* ======================= */}
      {/* 🚨 ALERT */}
      {/* ======================= */}
      {emergency && (
        <div className="fixed top-5 right-5 bg-red-600 text-white px-6 py-3 rounded shadow-lg z-50 animate-pulse">
          🚑 Incoming Emergency Patient!
        </div>
      )}

      {/* ======================= */}
      {/* 🚑 EMERGENCY SECTION */}
      {/* ======================= */}
      {!emergency ? (
        <div className="text-gray-500 text-center mt-10">
          No active emergencies 🚑
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* MAP */}
          <div className="h-[500px] border rounded overflow-hidden">
            <DriverHospitalMap
              driverLocation={driverLocation}
              hospitalLocation={{
                lat: Number(emergency.hospital?.location?.split(",")[0]),
                lng: Number(emergency.hospital?.location?.split(",")[1]),
              }}
              onEta={setEta}
            />
          </div>

          {/* DETAILS */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Patient Details</h2>

            <p>
              <strong>Name:</strong> {emergency.booking?.patientName || "N/A"}
            </p>

            <p>
              <strong>Condition:</strong>{" "}
              {emergency.booking?.condition || "Emergency"}
            </p>

            <p>
              <strong>Vehicle Type:</strong> {emergency.booking?.vehicleType}
            </p>

            <p>
              <strong>Distance:</strong> {emergency.distance?.toFixed(2)} km
            </p>

            <p>
              <strong>ETA:</strong> {eta ? `${eta} mins` : "Calculating..."}
            </p>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Hospital Info</h3>
              <p>{emergency.hospital?.hospitalName}</p>
              <p>{emergency.hospital?.location}</p>
            </div>
          </div>
        </div>
      )}

      {/* ======================= */}
      {/* 📹 CONSULTATION SECTION */}
      {/* ======================= */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">📹 Consultation Requests</h2>

        {consultations.length === 0 ? (
          <p className="text-gray-500">No consultation requests</p>
        ) : (
          consultations.map((c) => (
            <AppointmentCard
              key={c._id}
              consultation={c}
              role="hospital"
              onAccept={acceptConsultation}
            />
          ))
        )}
      </div>
    </div>
  );
}
