import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PatientMap from "../../components/maps/PatientMap";
import socket from "../../socket/socket";
import { Ambulance, Clock3, MapPin, ShieldAlert } from "lucide-react";

function Pill({ tone = "gray", children }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700 ring-gray-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    yellow: "bg-amber-50 text-amber-800 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tones[tone] || tones.gray}`}
    >
      {children}
    </span>
  );
}

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
  const [routeInfo, setRouteInfo] = useState(null);

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

  const patientLoc = emergency?.location || null;

  const headerText = useMemo(() => {
    if (tripStarted) return "Heading to hospital";
    if (status === "waiting") return "Finding the nearest ambulance";
    if (status === "accepted" && arrived) return "Ambulance has arrived";
    if (status === "accepted") return "Ambulance is on the way";
    return "Emergency";
  }, [tripStarted, status, arrived]);

  // 🔥 AFTER PICKUP → HOLD SCREEN
  if (tripStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 flex items-center justify-center px-6">
        <div className="bg-white/80 backdrop-blur border border-white/60 shadow-sm rounded-3xl p-8 max-w-lg w-full text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
            <Ambulance className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            Help is on the way
          </h1>
          <p className="text-gray-600 mt-2">
            You’re now heading to the hospital. Stay calm — you’re in safe
            hands.
          </p>
          <button
            type="button"
            onClick={() => navigate("/patient/dashboard")}
            className="mt-6 w-full rounded-2xl bg-gray-900 text-white py-3 font-semibold hover:bg-gray-800 transition"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gray-50">
      {/* MAP (full screen) */}
      {patientLoc ? (
        <div className="absolute inset-0">
          <PatientMap
            height="100vh"
            patientLocation={patientLoc}
            driverLocation={status === "accepted" ? driverLocation : null}
            onInfo={(info) => setRouteInfo(info)}
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-gray-600">Location not available</p>
        </div>
      )}

      {/* Top overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-center pointer-events-none">
        <div className="pointer-events-auto bg-white/85 backdrop-blur border border-white/60 shadow-sm rounded-2xl px-4 py-3 max-w-xl w-full">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {headerText}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Keep your phone nearby. We’ll update you live.
              </p>
            </div>
            {status === "waiting" ? (
              <Pill tone="yellow">
                <Clock3 className="w-3.5 h-3.5" />
                Searching
              </Pill>
            ) : (
              <Pill tone={arrived ? "green" : "blue"}>
                <Ambulance className="w-3.5 h-3.5" />
                {arrived ? "Arrived" : "En route"}
              </Pill>
            )}
          </div>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="absolute left-0 right-0 bottom-0 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-2xl">
          <div className="bg-white/90 backdrop-blur border border-white/60 shadow-[0_-10px_30px_rgba(0,0,0,0.12)] rounded-t-3xl p-5">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Emergency request
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Pill tone="red">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Active
                  </Pill>
                  <Pill tone="gray">ID: {String(emergency?._id || "").slice(-6)}</Pill>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/patient/dashboard")}
                className="text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3">
                <p className="text-xs font-semibold text-gray-500">ETA</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {routeInfo?.duration || (status === "waiting" ? "—" : "Updating…")}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3">
                <p className="text-xs font-semibold text-gray-500">Distance</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {routeInfo?.distance || (status === "waiting" ? "—" : "Updating…")}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-xs text-gray-600 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>
                  {patientLoc
                    ? `${patientLoc.lat.toFixed(4)}, ${patientLoc.lng.toFixed(4)}`
                    : "—"}
                </span>
              </div>
              {status === "waiting" ? (
                <Pill tone="yellow">Dispatching ambulance…</Pill>
              ) : (
                <Pill tone={arrived ? "green" : "blue"}>
                  {arrived ? "Arriving now" : "On the way"}
                </Pill>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
