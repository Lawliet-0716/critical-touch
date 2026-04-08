import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DriverMap from "../../components/maps/DriverMap";
import DriverHospitalMap from "../../components/maps/DriverHospitalMap";
import socket from "../../socket/socket";
import api from "../../services/api";
import {
  Ambulance,
  ArrowRight,
  Flag,
  MapPin,
  PhoneCall,
  Timer,
} from "lucide-react";

function Pill({ tone = "gray", children }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700 ring-gray-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    yellow: "bg-amber-50 text-amber-800 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
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

export default function DriverEmergencyPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const stored = localStorage.getItem("emergency");
  const emergency = state?.emergency || (stored ? JSON.parse(stored) : null);

  const [driverLocation, setDriverLocation] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [etaToHospitalMin, setEtaToHospitalMin] = useState(null);

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

  const patientLoc = emergency?.location || null;

  const openGoogleMaps = (destination) => {
    if (!destination) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

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
      <div className="min-h-screen relative bg-gray-50">
        <div className="absolute inset-0">
          <DriverHospitalMap destination={emergency?.destination} onEta={setEtaToHospitalMin} />
        </div>

        {/* Top overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-center pointer-events-none">
          <div className="pointer-events-auto bg-white/85 backdrop-blur border border-white/60 shadow-sm rounded-2xl px-4 py-3 max-w-xl w-full">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  En route to hospital
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Drive safely. Keep emergency lane clear.
                </p>
              </div>
              <Pill tone="purple">
                <Ambulance className="w-3.5 h-3.5" />
                Trip active
              </Pill>
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
                    Destination
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Pill tone="blue">
                      <Timer className="w-3.5 h-3.5" />
                      ETA: {etaToHospitalMin ? `${etaToHospitalMin} min` : "—"}
                    </Pill>
                    <Pill tone="gray">
                      ID: {String(emergency?._id || "").slice(-6)}
                    </Pill>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openGoogleMaps(emergency?.destination)}
                  className="text-sm font-semibold text-gray-700 hover:text-gray-900"
                >
                  Open navigation
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleEndTrip}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 text-white py-3 font-semibold hover:bg-gray-800 transition"
                >
                  <Flag className="w-4 h-4" />
                  End trip
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gray-50">
      {/* MAP (full screen) */}
      <div className="absolute inset-0">
        {driverLocation && patientLoc && (
          <DriverMap
            height="100vh"
            driverLocation={driverLocation}
            patientLocation={patientLoc}
            onInfo={(info) => setRouteInfo(info)}
          />
        )}
      </div>

      {/* Top overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-center pointer-events-none">
        <div className="pointer-events-auto bg-white/85 backdrop-blur border border-white/60 shadow-sm rounded-2xl px-4 py-3 max-w-xl w-full">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                Navigating to patient
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Live location sharing is enabled.
              </p>
            </div>
            <Pill tone="green">
              <Ambulance className="w-3.5 h-3.5" />
              Active request
            </Pill>
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
                <p className="text-sm font-semibold text-gray-900">Pickup</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Pill tone="blue">
                    <Timer className="w-3.5 h-3.5" />
                    ETA: {routeInfo?.duration || "—"}
                  </Pill>
                  <Pill tone="gray">
                    {routeInfo?.distance ? `Distance: ${routeInfo.distance}` : "Updating…"}
                  </Pill>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openGoogleMaps(patientLoc)}
                className="text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                Open navigation
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>
                  {patientLoc
                    ? `${patientLoc.lat.toFixed(4)}, ${patientLoc.lng.toFixed(4)}`
                    : "—"}
                </span>
              </div>
              <Pill tone="yellow">Confirm pickup only after arrival</Pill>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => alert("Add patient contact here")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-100 text-gray-900 py-3 font-semibold hover:bg-gray-200 transition"
              >
                <PhoneCall className="w-4 h-4" />
                Call
              </button>
              <button
                type="button"
                onClick={handlePickup}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-white py-3 font-semibold hover:bg-emerald-700 transition"
              >
                Patient picked up
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
