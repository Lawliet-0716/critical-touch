import { useAuth } from "../../hooks/useAuth";
import { useEffect, useState } from "react";
import socket from "../../socket/socket";
import PoliceMap from "../../components/maps/PoliceMap";

export default function PoliceDashboard() {
  const { user, logout } = useAuth();

  const [policeLocation, setPoliceLocation] = useState(null);
  const [alert, setAlert] = useState(null);

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
      setAlert((prev) => {
        if (!prev) return data;
        if (prev?.driverId && data?.driverId && prev.driverId !== data.driverId) {
          return prev;
        }
        return { ...prev, ...data };
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
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="bg-white shadow rounded-xl p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">🚓 Police Dashboard</h2>

        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* Info */}
      <div className="mt-6 bg-white shadow rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-2">Welcome Officer 👮‍♂️</h3>
        <p className="text-gray-500">
          Alerts will appear when ambulance is nearby
        </p>
      </div>

      {/* 🚨 ALERT BOX WITH MAP */}
      {alert && (
        <div className="mt-6 bg-red-500 text-white shadow rounded-xl p-4">
          <h3 className="font-semibold mb-2">
            🚨 Ambulance Nearby ({alert.distance} km)
          </h3>

          {/* Map inside alert */}
          <div className="bg-white rounded-lg overflow-hidden mt-3">
            <PoliceMap
              policeLoc={policeLocation}
              ambulanceLoc={alert.ambulanceLocation}
            />
          </div>
        </div>
      )}
    </div>
  );
}
