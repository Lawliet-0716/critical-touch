import { useEffect, useMemo, useState } from "react";
import { Ambulance, HeartPulse, Video } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AISuggestions from "../../components/AISuggestions";
import socket from "../../socket/socket";

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [consultation, setConsultation] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [nowTick, setNowTick] = useState(0);

  const consultationSlot = consultation?.scheduledAt || null;

  const joinState = useMemo(() => {
    if (!consultationSlot) return { canJoin: false, slotText: null };

    // scheduledAt is stored as a slot like "10:00 AM"
    const m = String(consultationSlot)
      .trim()
      .match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);

    if (!m) return { canJoin: true, slotText: consultationSlot }; // unknown format → don't block

    let hours = Number(m[1]);
    const minutes = Number(m[2] ?? "0");
    const ampm = m[3].toUpperCase();

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return { canJoin: true, slotText: consultationSlot };
    }

    hours = hours % 12;
    if (ampm === "PM") hours += 12;

    const slot = new Date();
    slot.setSeconds(0, 0);
    slot.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const closeAfterMin = 45;
    const closeAt = new Date(slot.getTime() + closeAfterMin * 60 * 1000);

    return {
      // Only allow joining at/after the exact scheduled time.
      canJoin: now >= slot && now <= closeAt,
      slotText: consultationSlot,
    };
  }, [consultationSlot, nowTick]);

  // Re-evaluate join eligibility over time (so it appears automatically).
  useEffect(() => {
    if (!consultationSlot) return;
    const id = setInterval(() => setNowTick((x) => x + 1), 15_000);
    return () => clearInterval(id);
  }, [consultationSlot]);

  // 🚨 SOS
  const handleSOS = async () => {
    setLoading(true);

    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this device/browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await api.post("/emergency/request", {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });

          const emergency = res.data.emergency;

          if (!emergency?._id) {
            throw new Error("Emergency was not created");
          }

          localStorage.setItem("emergency", JSON.stringify(emergency));

          navigate("/patient/emergency", {
            state: { emergency },
          });
        } catch (err) {
          console.error(err);
          alert(err.response?.data?.message || "SOS failed.");
        } finally {
          setLoading(false);
        }
      },
      (geoErr) => {
        console.error(geoErr);
        alert("Location error");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  // 🩺 CONSULTATION (🔥 FIXED)
  const fetchConsultation = async () => {
    try {
      const res = await api.get("/consultation/my");

      console.log("Consultation API:", res.data);

      // ✅ ONLY ACTIVE CONSULTATION (IGNORE COMPLETED)
      if (
        res.data &&
        (res.data.patient === user?.id || res.data.patient === user?._id) &&
        res.data.status !== "completed" // 🔥 KEY FIX
      ) {
        setConsultation(res.data);
      } else {
        setConsultation(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 🚑 PREBOOKING
  const fetchBooking = async () => {
    try {
      setLoadingBooking(true);

      const res = await api.get("/prebooking/my");

      const bookings = Array.isArray(res.data) ? res.data : [];
      const active = bookings.find(
        (b) => b && b.status !== "cancelled" && b.status !== "completed",
      );

      setBooking(active || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBooking(false);
    }
  };

  // ❌ CANCEL BOOKING
  const handleCancel = async () => {
    try {
      await api.put(`/prebooking/${booking._id}/cancel`);
      alert("❌ Booking cancelled");
      setBooking(null);
    } catch (err) {
      console.error(err);
      alert("Cancel failed");
    }
  };

  // ⏱ TIME LEFT
  const getTimeLeft = () => {
    if (!booking) return "";

    const diff = new Date(booking.scheduledAt) - new Date();
    if (diff <= 0) return "Starting soon";

    return `${Math.floor(diff / 60000)} min remaining`;
  };

  // 🔄 LOAD + AUTO REFRESH
  useEffect(() => {
    if (user) {
      fetchConsultation();
      fetchBooking();
    }

    const interval = setInterval(() => {
      fetchConsultation(); // 🔥 IMPORTANT
      fetchBooking();
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // 👤 Load patient profile (name + UHID)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/patient/me");
        setProfile(res.data?.patient || null);
      } catch (err) {
        console.error(err);
        setProfile(null);
      }
    };

    if (user?.id) fetchProfile();
  }, [user?.id]);

  // 🔌 SOCKET
  useEffect(() => {
    if (!socket.connected) socket.connect();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    socket.emit("join", { userId: user.id, role: "patient" });
  }, [user]);

  useEffect(() => {
    const handler = () => {
      localStorage.removeItem("emergency");
      window.location.reload();
    };

    socket.on("tripEnded", handler);
    return () => socket.off("tripEnded", handler);
  }, []);

  // 🎥 JOIN CALL
  const handleJoin = () => {
    if (consultation?._id) {
      navigate(`/consultation/${consultation._id}`);
    }
  };

  const handleCancelConsultation = async () => {
    if (!consultation?._id) return;
    try {
      await api.put(`/consultation/cancel/${consultation._id}`);
      setConsultation(null);
      alert("✅ Appointment cancelled");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Cancel failed");
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* HEADER */}
      <div className="bg-white p-5 rounded-2xl shadow-md mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/patient/edit")}
            className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow"
            title="Edit profile"
            type="button"
          >
            {profile?.firstName
              ? profile.firstName.charAt(0).toUpperCase()
              : "P"}
          </button>

          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              {profile
                ? `${profile.firstName} ${profile.lastName}`.trim()
                : "Patient"}
            </h1>
            <p className="text-sm text-gray-500">
              UHID: {profile?.uhid || "N/A"}
            </p>
          </div>
        </div>
        <p className="text-green-500 text-sm font-semibold">● Online</p>
      </div>

      {/* 🚨 SOS */}
      <div className="bg-red-500 text-white p-8 rounded-3xl shadow-xl mb-6 text-center">
        <h2 className="text-2xl font-bold mb-2 flex justify-center gap-2">
          <HeartPulse /> Emergency SOS
        </h2>

        <button
          onClick={handleSOS}
          disabled={loading}
          className="bg-white text-red-600 px-6 py-2 rounded-full"
        >
          {loading ? "Processing..." : "SOS"}
        </button>
      </div>

      {/* 🚑 PREBOOK */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold flex gap-2 mb-3">
            <Ambulance className="text-blue-500" />
            Pre-Booked Ambulance
          </h2>

          {loadingBooking ? (
            <p>Loading booking...</p>
          ) : !booking ? (
            <>
              <p className="text-gray-500 mb-4 text-sm">
                Schedule ambulance in advance
              </p>
              <button
                onClick={() => navigate("/patient/prebook")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Pre-Book
              </button>
            </>
          ) : (
            <>
              <p>Pickup: {booking.pickupLocation.address}</p>
              <p>Time: {new Date(booking.scheduledAt).toLocaleString()}</p>
              <p className="text-orange-500">⏱ {getTimeLeft()}</p>
              <p>Status: {booking.status.toUpperCase()}</p>

              {(booking.status === "pending" ||
                booking.status === "dispatched") && (
                <button
                  onClick={handleCancel}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>

        <AISuggestions handleSOS={handleSOS} />
      </div>

      {/* 🩺 CONSULTATION */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-lg font-semibold flex gap-2 mb-3">
          <Video className="text-purple-500" />
          Online Consultation
        </h2>

        {!consultation && (
          <button
            onClick={() => navigate("/consultation/book")}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            Book Consultation
          </button>
        )}

        {consultation?.status === "booked" && (
          <div className="text-yellow-700">
            <p>⏳ Waiting for doctor to accept...</p>
            {consultation?.scheduledAt && (
              <p className="text-sm text-gray-600 mt-1">
                Scheduled at: {consultation.scheduledAt}
              </p>
            )}
          </div>
        )}

        {consultation?.status === "accepted" && (
          <>
            {!joinState.canJoin ? (
              <p className="text-sm text-gray-700">
                Scheduled at: {joinState.slotText || consultation.scheduledAt}
              </p>
            ) : (
              <button
                onClick={handleJoin}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                🎥 Join Call
              </button>
            )}
            <button
              onClick={handleCancelConsultation}
              className="ml-3 bg-red-500 text-white px-4 py-2 rounded"
            >
              Cancel Appointment
            </button>
          </>
        )}

        {consultation?.status === "booked" && (
          <button
            onClick={handleCancelConsultation}
            className="mt-3 bg-red-500 text-white px-4 py-2 rounded"
          >
            Cancel Appointment
          </button>
        )}
      </div>
    </div>
  );
}
