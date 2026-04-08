import { useAuth } from "../../hooks/useAuth";
import { useEffect, useRef, useState } from "react";
import socket from "../../socket/socket";
import PoliceMap from "../../components/maps/PoliceMap";
import {
  Shield,
  AlertTriangle,
  MapPin,
  Activity,
  Clock,
  CheckCircle,
  Wifi,
  WifiOff,
  Navigation,
  Users,
  TrendingUp,
  LogOut
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

export default function PoliceDashboard() {
  const { user, logout } = useAuth();

  const [policeLocation, setPoliceLocation] = useState(null);
  const [alert, setAlert] = useState(null);
  const alertRafRef = useRef(null);
  const latestAlertRef = useRef(null);

  // 🔌 CONNECT SOCKET
  useEffect(() => {
    if (!socket.connected) socket.connect();
  }, []);

  // 🔑 JOIN ROOM
  useEffect(() => {
    if (!user?.id) return;

    socket.emit("join", {
      userId: user.id,
      role: "police",
    });
  }, [user]);

  // =======================
  // 📍 POLICE LOCATION
  // =======================
  useEffect(() => {
    if (!user) return;

    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setPoliceLocation(location);

        socket.emit("police_location_update", {
          policeId: user.id,
          location,
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user]);

  // =======================
  // 🚨 ALERT LISTENER
  // =======================
  useEffect(() => {
    socket.on("ambulance_nearby", (data) => {
      console.log("🚨 Nearby:", data);
      setAlert(data);
    });

    socket.on("ambulance_location_update", (data) => {
      // Throttle UI updates to animation frames to keep map smooth.
      latestAlertRef.current = data;
      if (alertRafRef.current) return;
      alertRafRef.current = requestAnimationFrame(() => {
        alertRafRef.current = null;
        const next = latestAlertRef.current;
        if (!next) return;

        setAlert((prev) => {
          if (!prev) return next;
          if (prev?.driverId && next?.driverId && prev.driverId !== next.driverId) {
            return prev;
          }
          return { ...prev, ...next };
        });
      });
    });

    socket.on("ambulance_left", (data) => {
      console.log("✅ Ambulance left:", data);
      setAlert(null); // 🔥 remove alert
    });

    return () => {
      socket.off("ambulance_nearby");
      socket.off("ambulance_location_update");
      socket.off("ambulance_left");
      if (alertRafRef.current) cancelAnimationFrame(alertRafRef.current);
      alertRafRef.current = null;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 🔷 HEADER */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm text-white flex items-center justify-center rounded-2xl font-bold shadow-lg">
                <Shield size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Police Control Center
                </h1>
                <p className="text-blue-100 mt-1">
                  Officer ID: {user?.id || "Unknown"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end gap-2">
                <StatusPill tone="green">
                  <Wifi size={12} />
                  Online
                </StatusPill>
                <StatusPill tone="green">
                  <CheckCircle size={12} />
                  Location Active
                </StatusPill>
              </div>
              <button
                onClick={logout}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 backdrop-blur-sm"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </Card>

        {/* 📊 STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Alerts Today"
            value="3"
            icon={<AlertTriangle size={20} />}
            color="red"
            subtitle="Active emergency responses"
          />
          <StatCard
            title="Avg Response"
            value="2.3 min"
            icon={<Clock size={20} />}
            color="blue"
            subtitle="Average response time"
          />
          <StatCard
            title="Active Alerts"
            value={alert ? "1" : "0"}
            icon={<Activity size={20} />}
            color="yellow"
            subtitle="Currently monitoring"
          />
          <StatCard
            title="Total Responses"
            value="1,247"
            icon={<TrendingUp size={20} />}
            color="green"
            subtitle="All-time responses"
          />
        </div>

        {/* 🚨 ACTIVE ALERT */}
        {alert && (
          <Card
            title="🚨 Active Emergency Alert"
            icon={<AlertTriangle className="text-red-600" />}
            right={
              <StatusPill tone="red">
                <Activity size={12} />
                {alert.distance} km away
              </StatusPill>
            }
            className="border-red-200 bg-red-50/50"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="text-blue-600" size={16} />
                      <span className="text-sm font-medium text-gray-700">Ambulance ID</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{alert.driverId || "Unknown"}</p>
                  </div>

                  <div className="bg-white/60 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="text-green-600" size={16} />
                      <span className="text-sm font-medium text-gray-700">Distance</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{alert.distance} km</p>
                  </div>
                </div>

                <div className="bg-white/60 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="text-purple-600" size={16} />
                    <span className="text-sm font-medium text-gray-700">Alert Time</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date().toLocaleString()}
                  </p>
                </div>

                {alert.patientInfo && (
                  <div className="bg-white/60 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="text-indigo-600" size={16} />
                      <span className="text-sm font-medium text-gray-700">Patient Info</span>
                    </div>
                    <p className="text-sm text-gray-600">{alert.patientInfo}</p>
                  </div>
                )}
              </div>

              <div className="bg-white/60 rounded-lg overflow-hidden">
                <PoliceMap
                  policeLoc={policeLocation}
                  ambulanceLoc={alert.ambulanceLocation}
                />
              </div>
            </div>
          </Card>
        )}

        {/* ℹ️ STATUS INFO */}
        <Card
          title="System Status"
          icon={<Activity className="text-blue-600" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Connection Status</h4>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={16} />
                <span className="text-sm text-green-600">
                  Connected to dispatch
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Location Tracking</h4>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={16} />
                <span className="text-sm text-green-600">
                  Location Active
                </span>
              </div>
            </div>
          </div>

          {policeLocation && (
            <div className="mt-4 p-3 bg-blue-50/60 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="text-blue-600" size={16} />
                <span className="text-sm font-medium text-gray-700">Current Location</span>
              </div>
              <p className="text-sm text-gray-600 font-mono">
                {policeLocation.lat.toFixed(6)}, {policeLocation.lng.toFixed(6)}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
