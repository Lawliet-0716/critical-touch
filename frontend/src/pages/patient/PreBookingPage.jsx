import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

import PreBookingMap from "../../components/prebooking/PreBookingMap";
import HospitalSearch from "../../components/prebooking/HospitalSearch";
import RoutePreviewMap from "../../components/prebooking/RoutePreviewMap";

export default function PreBookingPage() {
  const navigate = useNavigate();

  const [pickup, setPickup] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [vehicleType, setVehicleType] = useState("BASIC");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);

  // =======================
  // 🚑 SUBMIT BOOKING
  // =======================
  const handleSubmit = async () => {
    if (!pickup || !hospital || !scheduledAt) {
      return alert("⚠️ Please fill all fields");
    }

    // ❗ Prevent past time booking
    const selectedTime = new Date(scheduledAt);
    const now = new Date();

    if (selectedTime < now) {
      return alert("⚠️ Please select a future time");
    }

    try {
      setLoading(true);

      // 🔥 IMPORTANT: Send clean lat/lng
      await api.post("/prebooking/create", {
        pickupLocation: {
          lat: pickup.lat,
          lng: pickup.lng,
          address: pickup.address,
        },
        dropLocation: {
          lat: hospital.lat,
          lng: hospital.lng,
          address: hospital.address,
        },
        vehicleType,
        scheduledAt: selectedTime.toISOString(),
      });

      alert("✅ Booking successful 🚑");

      navigate("/patient/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "❌ Booking failed");
    } finally {
      setLoading(false);
    }
  };

  // =======================
  // UI
  // =======================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
        {/* 🔷 TITLE */}
        <h1 className="text-2xl font-bold mb-6 text-center">
          🚑 Pre-Book Ambulance
        </h1>

        {/* 📍 PICKUP */}
        <div className="mb-6">
          <PreBookingMap onSelect={setPickup} />

          {pickup && (
            <p className="text-green-600 text-sm mt-2">
              ✔ Pickup: {pickup.address}
            </p>
          )}
        </div>

        {/* 🏥 HOSPITAL */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">🏥 Select Hospital</h3>

          <HospitalSearch onSelect={setHospital} />

          {hospital && (
            <p className="text-green-600 text-sm mt-2">
              ✔ Hospital: {hospital.address}
            </p>
          )}
        </div>

        {/* 🗺️ ROUTE PREVIEW */}
        {pickup && hospital && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">🗺️ Route Preview</h3>
            <RoutePreviewMap pickup={pickup} hospital={hospital} />
          </div>
        )}

        {/* 🚑 VEHICLE */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">🚑 Vehicle Type</label>

          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            <option value="BASIC">BASIC</option>
            <option value="ADVANCED">ADVANCED</option>
            <option value="ICU">ICU</option>
          </select>
        </div>

        {/* ⏰ TIME */}
        <div className="mb-6">
          <label className="block font-semibold mb-1">⏰ Schedule Time</label>

          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
        </div>

        {/* ✅ BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-semibold transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Processing..." : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}
