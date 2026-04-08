import { useState, useEffect } from "react";
import {
  MapPin,
  CheckCircle,
  XCircle,
  Ambulance,
  Clock,
  User,
  Car,
  AlertTriangle,
  Calendar,
  Navigation,
  Phone,
  Activity
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import socket from "../../socket/socket";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

function StatusPill({ tone = "gray", children }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700 ring-gray-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    yellow: "bg-amber-50 text-amber-800 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    purple: "bg-purple-50 text-purple-700 ring-purple-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tones[tone] || tones.gray}`}
    >
      {children}
    </span>
  );
}

function Card({ title, icon, right, children, className = "" }) {
  return (
    <div
      className={`bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-white/60 shadow-sm rounded-2xl p-5 ${className}`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gray-900/5 flex items-center justify-center">
            {icon}
          </div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function StatCard({ title, value, icon, color = "blue" }) {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    red: "text-red-600 bg-red-50",
    yellow: "text-yellow-600 bg-yellow-50",
  };

  return (
    <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-white/60 shadow-sm rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("Available");
  const [driverProfile, setDriverProfile] = useState(null);
  const [stats, setStats] = useState({
    totalTrips: 0,
    todayTrips: 0,
    responseRate: 0,
    rating: 0
  });
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // 📊 LOAD DRIVER STATS
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // This would be a real API call in production
        // For now, we'll use mock data
        setStats({
          totalTrips: 247,
          todayTrips: 3,
          responseRate: 98,
          rating: 4.8
        });
      } catch (err) {
        console.error(err);
      }
    };

    if (driverProfile) {
      fetchStats();
    }
  }, [driverProfile]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 🔷 HEADER */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm text-white flex items-center justify-center rounded-2xl font-bold shadow-lg">
                <User size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome back, {driverProfile?.name || "Driver"}!
                </h1>
                <p className="text-blue-100 mt-1">
                  License: {driverProfile?.licenseNumber || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <StatusPill tone={status === "Available" ? "green" : "red"}>
                <Activity size={12} />
                {status}
              </StatusPill>
              <div className="text-right">
                <p className="text-sm text-blue-100">Current Status</p>
                <p className="text-lg font-semibold">{status}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* 📊 STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Trips"
            value={stats.totalTrips}
            icon={<Car size={20} />}
            color="blue"
          />
          <StatCard
            title="Today's Trips"
            value={stats.todayTrips}
            icon={<Calendar size={20} />}
            color="green"
          />
          <StatCard
            title="Response Rate"
            value={`${stats.responseRate}%`}
            icon={<Clock size={20} />}
            color="yellow"
          />
          <StatCard
            title="Rating"
            value={stats.rating}
            icon={<CheckCircle size={20} />}
            color="purple"
          />
        </div>

        {/* 🚑 REQUEST LIST */}
        <Card
          title="Incoming Requests"
          icon={<Ambulance className="text-red-600" />}
          right={
            <StatusPill tone="blue">
              {requests.length} active
            </StatusPill>
          }
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading requests...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ambulance className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-500 text-lg font-medium">No active requests</p>
              <p className="text-gray-400 text-sm mt-1">New requests will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-200 bg-gradient-to-r from-white to-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* LEFT - Request Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="text-red-600" size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {req._kind === "prebooking"
                              ? `${req.patient?.firstName || "Patient"} ${req.patient?.lastName || ""}`.trim()
                              : req.patient?.firstName || "Patient"}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusPill tone={req._kind === "prebooking" ? "blue" : "red"}>
                              {req._kind === "prebooking" ? "Pre-booked" : "Emergency"}
                            </StatusPill>
                            {req._kind === "prebooking" && (
                              <StatusPill tone="yellow">
                                <Clock size={12} />
                                {new Date(req.scheduledAt).toLocaleString()}
                              </StatusPill>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin size={16} className="text-gray-400" />
                          <span className="text-sm">
                            {req._kind === "prebooking"
                              ? `${req.pickupLocation?.lat?.toFixed(4)}, ${req.pickupLocation?.lng?.toFixed(4)}`
                              : `${req.location?.lat?.toFixed(4)}, ${req.location?.lng?.toFixed(4)}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Car size={16} className="text-gray-400" />
                          <span className="text-sm">
                            {req._kind === "prebooking"
                              ? `Vehicle: ${req.vehicleType || "BASIC"}`
                              : `Type: ${req.emergencyType || "Emergency"}`}
                          </span>
                        </div>

                        {req.patient?.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone size={16} className="text-gray-400" />
                            <span className="text-sm">{req.patient.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT - Actions */}
                    <div className="flex flex-col gap-2 min-w-[120px]">
                      <button
                        onClick={() =>
                          req._kind === "prebooking"
                            ? handleAcceptPreBooking(req)
                            : handleAcceptEmergency(req)
                        }
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                      >
                        <CheckCircle size={16} />
                        Accept
                      </button>

                      <button
                        onClick={() => handleReject(req)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
