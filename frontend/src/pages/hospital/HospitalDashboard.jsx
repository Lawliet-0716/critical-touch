import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../../socket/socket";
import DriverHospitalMap from "../../components/maps/DriverHospitalMap";
import AppointmentCard from "../../components/AppointmentCard";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import {
  Hospital,
  AlertTriangle,
  MapPin,
  Clock,
  User,
  Car,
  Activity,
  Stethoscope,
  Settings,
  TrendingUp,
  Users,
  CheckCircle
} from "lucide-react";

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

function StatCard({ title, value, icon, color = "blue", subtitle }) {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    red: "text-red-600 bg-red-50",
    yellow: "text-yellow-600 bg-yellow-50",
    purple: "text-purple-600 bg-purple-50",
  };

  return (
    <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-white/60 shadow-sm rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

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

    console.log("🏥 Hospital prepared to join with ID:", hospitalId);

    const joinHospitalRoom = () => {
      console.log("⛓️ Joining hospital socket rooms for:", hospitalId);
      socket.emit("join", {
        userId: hospitalId,
        role: "hospital",
      });
      socket.emit("test_hospital", { hospitalId });
    };

    const handleConnect = () => {
      console.log("✅ Socket connected, joining hospital room");
      joinHospitalRoom();
    };

    const handleConnectError = (error) => {
      console.error("❌ Socket connect error:", error);
    };

    if (!socket.connected) {
      socket.connect();
    } else {
      joinHospitalRoom();
    }

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("test_message", (data) => {
      console.log("🏥 Hospital test message received:", data);
    });

    // =======================
    // 🚑 EMERGENCY EVENTS
    // =======================
    const handleNewEmergency = (data) => {
      console.log("🚑 Emergency received:", data);
      setEmergency(data);

      if (data.booking?.location) {
        setDriverLocation(data.booking.location);
      }
    };

    const handleAmbulanceUpdate = (data) => {
      console.log("📍 Ambulance location update:", data);
      setDriverLocation(data.location);
      setEta(data.eta);
    };

    const handleEmergencyEnded = () => {
      console.log("✅ Emergency ended");
      setEmergency(null);
      setDriverLocation(null);
      setEta(null);
    };

    // =======================
    // 📹 CONSULTATION EVENTS
    // =======================
    const handleNewConsultation = (data) => {
      console.log("📹 New consultation:", data);
      setConsultations((prev) => [data.consultation || data, ...prev]);
    };

    const handleConsultationCompleted = (data) => {
      console.log("✅ Consultation completed:", data._id);
      setConsultations((prev) => prev.filter((c) => c._id !== data._id));
    };

    socket.on("newEmergency", handleNewEmergency);
    socket.on("ambulanceUpdate", handleAmbulanceUpdate);
    socket.on("emergencyEnded", handleEmergencyEnded);
    socket.on("newConsultation", handleNewConsultation);
    socket.on("consultationCompleted", handleConsultationCompleted);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("test_message");
      socket.off("newEmergency", handleNewEmergency);
      socket.off("ambulanceUpdate", handleAmbulanceUpdate);
      socket.off("emergencyEnded", handleEmergencyEnded);
      socket.off("newConsultation", handleNewConsultation);
      socket.off("consultationCompleted", handleConsultationCompleted);
    };
  }, [user]);

  // =======================
  // � FETCH HOSPITAL PENDING EMERGENCY
  // =======================
  useEffect(() => {
    const fetchHospitalEmergency = async () => {
      try {
        const res = await api.get("/emergency/pending-hospital");
        console.log("🏥 Hospital pending emergency response:", res.data);

        if (res.data?.emergency) {
          setEmergency(res.data.emergency);
          const location =
            res.data.emergency.booking?.location ||
            res.data.emergency.emergency?.location ||
            res.data.emergency.location;
          if (location) {
            setDriverLocation(location);
          }
        }
      } catch (err) {
        console.error("❌ Error fetching hospital pending emergency:", err);
      }
    };

    fetchHospitalEmergency();
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ======================= */}
        {/* HEADER */}
        {/* ======================= */}
        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm text-white flex items-center justify-center rounded-2xl font-bold shadow-lg">
                <Hospital size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Hospital Control Center
                </h1>
                <p className="text-emerald-100 mt-1">
                  Emergency Response & Consultation Hub
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end gap-2">
                <StatusPill tone={emergency ? "red" : "green"}>
                  {emergency ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                  {emergency ? "Emergency Active" : "All Clear"}
                </StatusPill>
                <StatusPill tone="blue">
                  <Activity size={12} />
                  {consultations.length} Consultations
                </StatusPill>
              </div>
              <button
                onClick={() => navigate("/hospital/edit")}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 backdrop-blur-sm"
              >
                <Settings size={16} />
                Edit Hospital
              </button>
            </div>
          </div>
        </Card>
        {/* 📊 STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Emergencies"
            value={emergency ? "1" : "0"}
            icon={<AlertTriangle size={20} />}
            color="red"
            subtitle="Currently responding"
          />
          <StatCard
            title="Pending Consultations"
            value={consultations.length}
            icon={<Stethoscope size={20} />}
            color="blue"
            subtitle="Awaiting response"
          />
          <StatCard
            title="Today's Patients"
            value="24"
            icon={<Users size={20} />}
            color="green"
            subtitle="Total admissions"
          />
          <StatCard
            title="Response Rate"
            value="98%"
            icon={<TrendingUp size={20} />}
            color="purple"
            subtitle="Emergency response"
          />
        </div>

        {/* ======================= */}
        {/* 🚨 ALERT */}
        {/* ======================= */}
        {emergency && (
          <div className="fixed top-5 right-5 bg-red-600 text-white px-6 py-3 rounded-2xl shadow-xl z-50 animate-pulse border border-red-500">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} />
              <span className="font-semibold">🚑 Incoming Emergency Patient!</span>
            </div>
          </div>
        )}

        {/* ======================= */}
        {/* 🚑 EMERGENCY SECTION */}
        {/* ======================= */}
        <Card
          title="Emergency Response Center"
          icon={<AlertTriangle className="text-red-600" />}
          right={
            <StatusPill tone={emergency ? "red" : "green"}>
              {emergency ? "Active Emergency" : "No Active Emergencies"}
            </StatusPill>
          }
        >
          {!emergency ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Hospital className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-500 text-lg font-medium">No active emergencies</p>
              <p className="text-gray-400 text-sm mt-1">Emergency alerts will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* MAP */}
              <div className="bg-white/60 rounded-xl overflow-hidden border border-gray-200">
                <DriverHospitalMap
                  driverLocation={driverLocation}
                  hospitalLocation={
                    emergency.hospital?.location
                      ? {
                          lat: Number(emergency.hospital.location.split(",")[0]),
                          lng: Number(emergency.hospital.location.split(",")[1]),
                        }
                      : emergency.destination?.lat && emergency.destination?.lng
                      ? {
                          lat: emergency.destination.lat,
                          lng: emergency.destination.lng,
                        }
                      : null
                  }
                  onEta={setEta}
                />
              </div>

              {/* DETAILS */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="text-blue-600" size={18} />
                      <span className="text-sm font-medium text-gray-700">Patient Name</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {emergency.booking?.patientName || 
                       emergency.patient?.firstName || 
                       emergency.patientName || 
                       "N/A"}
                    </p>
                  </div>

                  <div className="bg-white/60 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="text-green-600" size={18} />
                      <span className="text-sm font-medium text-gray-700">UHID</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {emergency.booking?.uhid || 
                       emergency.patient?.uhid || 
                       emergency.uhid || 
                       "N/A"}
                    </p>
                  </div>
                </div>

                <div className="bg-white/60 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="text-blue-600" size={18} />
                    <span className="text-sm font-medium text-gray-700">Assigned Hospital</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {emergency.hospital?.hospitalName || emergency.destination?.address || "Nearest Hospital"}
                  </p>
                  {emergency.hospital?.location && (
                    <p className="text-sm text-gray-500 mt-1">
                      {emergency.hospital.location}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="text-red-600" size={18} />
                      <span className="text-sm font-medium text-gray-700">Condition</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {emergency.booking?.condition || 
                       emergency.condition || 
                       emergency.emergencyType || 
                       "Emergency"}
                    </p>
                  </div>

                  <div className="bg-white/60 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Car className="text-purple-600" size={18} />
                      <span className="text-sm font-medium text-gray-700">Vehicle Type</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {emergency.booking?.vehicleType || 
                       emergency.vehicleType || 
                       "Standard"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="text-green-600" size={18} />
                      <span className="text-sm font-medium text-gray-700">Distance</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {emergency.distance?.toFixed(2) || 
                       emergency.booking?.distance?.toFixed(2) || 
                       "Calculating..."}
                       {" "} km
                    </p>
                  </div>

                  <div className="bg-white/60 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="text-yellow-600" size={18} />
                      <span className="text-sm font-medium text-gray-700">ETA</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {eta ? `${eta} mins` : "Calculating..."}
                    </p>
                  </div>
                </div>

                <div className="bg-white/60 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Hospital className="text-indigo-600" size={18} />
                    <span className="text-sm font-medium text-gray-700">Hospital Info</span>
                  </div>
                  <p className="text-base font-semibold text-gray-900 mb-1">
                    {emergency.hospital?.hospitalName || "Hospital"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {emergency.hospital?.location || 
                     emergency.location || 
                     "Location unavailable"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* ======================= */}
        {/* 📹 CONSULTATION SECTION */}
        {/* ======================= */}
        <Card
          title="Consultation Requests"
          icon={<Stethoscope className="text-blue-600" />}
          right={
            <StatusPill tone="blue">
              {consultations.length} pending
            </StatusPill>
          }
        >
          {consultations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-500 text-lg font-medium">No consultation requests</p>
              <p className="text-gray-400 text-sm mt-1">New requests will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {consultations.map((c) => (
                <AppointmentCard
                  key={c._id}
                  consultation={c}
                  role="hospital"
                  onAccept={acceptConsultation}
                />
              ))}
            </div>
          )}
        </Card>

        {/* ======================= */}
        {/* 🐛 DEBUG PANEL */}
        {/* ======================= */}
        {emergency && (
          <Card
            title="Debug: Emergency Data"
            icon={<Activity className="text-gray-600" />}
            className="bg-gray-50/80"
          >
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-auto max-h-64">
              <pre>{JSON.stringify(emergency, null, 2)}</pre>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
