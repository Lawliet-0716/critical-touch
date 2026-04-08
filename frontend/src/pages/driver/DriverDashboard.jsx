import { useState, useEffect } from "react";
import { MapPin, CheckCircle, XCircle, Ambulance } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import socket from "../../socket/socket";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("Available");
  const [driverProfile, setDriverProfile] = useState(null);

  const getRejectedIds = (kind) => {
    try {
      const raw = localStorage.getItem("rejectedRequests");
      const parsed = raw ? JSON.parse(raw) : {};
      const list = parsed?.[kind] || [];
      return new Set(list);
    } catch {
      return new Set();
    }
  };

  const addRejectedId = (kind, id) => {
    try {
      const raw = localStorage.getItem("rejectedRequests");
      const parsed = raw ? JSON.parse(raw) : {};
      const existing = Array.isArray(parsed[kind]) ? parsed[kind] : [];
      const next = Array.from(new Set([...existing, id]));
      localStorage.setItem(
        "rejectedRequests",
        JSON.stringify({ ...parsed, [kind]: next }),
      );
    } catch {
      // ignore storage errors
    }
  };

  // 🔌 CONNECT SOCKET
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  // 🔑 JOIN ROOM
  useEffect(() => {
    if (user) {
      socket.emit("join", {
        userId: user.id,
        role: "driver",
      });
    }
  }, [user]);

  // 👤 LOAD DRIVER PROFILE (for name/license)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/driver/me");
        setDriverProfile(res.data?.driver || null);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
  }, []);

  // 📡 REAL-TIME REQUESTS
  useEffect(() => {
    if (!user) return;

    const handler = (data) => {
      const rejected = getRejectedIds("emergency");
      if (rejected.has(data?._id)) return;
      setRequests((prev) => [{ ...data, _kind: "emergency" }, ...prev]);
    };

    socket.on("newEmergency", handler);
    return () => socket.off("newEmergency", handler);
  }, [user]);

  // 📡 REAL-TIME PREBOOKINGS
  useEffect(() => {
    if (!user) return;

    const handler = (data) => {
      const rejected = getRejectedIds("prebooking");
      if (rejected.has(data?._id)) return;
      setRequests((prev) => [{ ...data, _kind: "prebooking" }, ...prev]);
    };

    socket.on("newPreBooking", handler);
    return () => socket.off("newPreBooking", handler);
  }, [user]);

  // 🧹 REMOVE CANCELLED/TAKEN PREBOOKINGS
  useEffect(() => {
    const cancelledHandler = (id) => {
      setRequests((prev) => prev.filter((r) => r._id !== id));
    };

    const takenHandler = (id) => {
      setRequests((prev) => prev.filter((r) => r._id !== id));
    };

    socket.on("preBookingCancelled", cancelledHandler);
    socket.on("preBookingTaken", takenHandler);

    return () => {
      socket.off("preBookingCancelled", cancelledHandler);
      socket.off("preBookingTaken", takenHandler);
    };
  }, []);

  // 📦 LOAD PENDING
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await api.get("/emergency/pending");
        const emergencies = (res.data?.emergencies || []).map((e) => ({
          ...e,
          _kind: "emergency",
        }));

        const rejected = getRejectedIds("emergency");
        setRequests(emergencies.filter((e) => !rejected.has(e._id)));
      } catch (err) {
        console.error(err);
      }
    };

    fetchPending();
  }, []);

  // 📦 LOAD DISPATCHED PREBOOKINGS
  useEffect(() => {
    const fetchDispatchedPreBookings = async () => {
      try {
        const res = await api.get("/prebooking/dispatched");
        const bookings = (res.data?.bookings || []).map((b) => ({
          ...b,
          _kind: "prebooking",
        }));

        const rejected = getRejectedIds("prebooking");
        setRequests((prev) => [
          ...bookings.filter((b) => !rejected.has(b._id)),
          ...prev,
        ]);
      } catch (err) {
        console.error(err);
      }
    };

    fetchDispatchedPreBookings();
  }, []);

  // ✅ ACCEPT
  const handleAcceptEmergency = async (req) => {
    try {
      const res = await api.put(`/emergency/${req._id}/accept`);
      const emergency = res.data.emergency;

      setStatus("Busy");

      localStorage.setItem("emergency", JSON.stringify(emergency));

      navigate("/driver/emergency", {
        state: {
          emergency,
          patientLocation: emergency.location,
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptPreBooking = async (booking) => {
    try {
      const res = await api.put(`/prebooking/${booking._id}/accept`);
      const emergency = res.data.emergency;

      setStatus("Busy");

      localStorage.setItem("emergency", JSON.stringify(emergency));

      navigate("/driver/emergency", {
        state: {
          emergency,
          patientLocation: emergency.location,
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = (req) => {
    addRejectedId(req._kind, req._id);
    setRequests((prev) => prev.filter((r) => r._id !== req._id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      {/* 🔷 HEADER */}
      <div className="bg-white p-5 rounded-2xl shadow-md mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-600 text-white flex items-center justify-center rounded-full font-bold shadow">
            {driverProfile?.name
              ? driverProfile.name.charAt(0).toUpperCase()
              : "D"}
          </div>

          <div>
            <h1 className="text-lg font-semibold">
              {driverProfile?.name || "Driver"}
            </h1>
            <p className="text-sm text-gray-500">
              License: {driverProfile?.licenseNumber || "N/A"}
            </p>
          </div>
        </div>

        <span
          className={`px-4 py-1 rounded-full text-white text-sm font-semibold ${
            status === "Available" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {status}
        </span>
      </div>

      {/* 🚑 REQUEST LIST */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Ambulance className="text-green-600" /> Incoming Requests
        </h2>

        {requests.length === 0 ? (
          <p className="text-gray-500 text-center">
            No active emergency requests
          </p>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req._id}
                className="border rounded-xl p-4 flex justify-between items-center hover:shadow-lg transition"
              >
                {/* LEFT */}
                <div>
                  <h3 className="font-semibold text-lg">
                    {req._kind === "prebooking"
                      ? `${req.patient?.firstName || "Patient"} (Pre-booking)`
                      : req.patient?.firstName || "Patient"}
                  </h3>

                  <p className="text-gray-600 flex items-center gap-1 text-sm">
                    <MapPin size={16} />
                    {req._kind === "prebooking"
                      ? `${req.pickupLocation?.lat}, ${req.pickupLocation?.lng}`
                      : `${req.location?.lat}, ${req.location?.lng}`}
                  </p>

                  <p className="text-red-500 text-sm mt-1">
                    {req._kind === "prebooking"
                      ? `${req.vehicleType || "BASIC"} • ${new Date(
                          req.scheduledAt,
                        ).toLocaleString()}`
                      : req.emergencyType || "Emergency"}
                  </p>
                </div>

                {/* RIGHT */}
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      req._kind === "prebooking"
                        ? handleAcceptPreBooking(req)
                        : handleAcceptEmergency(req)
                    }
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 transition"
                  >
                    <CheckCircle size={16} /> Accept
                  </button>

                  <button
                    onClick={() => handleReject(req)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 transition"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
