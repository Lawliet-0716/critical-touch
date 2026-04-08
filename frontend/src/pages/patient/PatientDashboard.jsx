import { useEffect, useMemo, useState } from "react";
import {
  Ambulance,
  ArrowRight,
  CalendarClock,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  Video,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AISuggestions from "../../components/AISuggestions";
import socket from "../../socket/socket";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* HEADER */}
        <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-white/60 shadow-sm rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/patient/edit")}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-sm"
              title="Edit profile"
              type="button"
            >
              {profile?.firstName
                ? profile.firstName.charAt(0).toUpperCase()
                : "P"}
            </button>

            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {profile
                  ? `${profile.firstName} ${profile.lastName}`.trim()
                  : "Patient"}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <StatusPill tone="blue">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  UHID: {profile?.uhid || "N/A"}
                </StatusPill>
                <StatusPill tone="green">Online</StatusPill>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/patient/ai")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800 transition"
          >
            AI Help
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 🚨 SOS */}
        <div className="relative overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-br from-red-600 via-red-500 to-rose-500 shadow-sm">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,white,transparent_55%)]" />
          <div className="relative p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
                  <HeartPulse className="w-4 h-4" />
                  Emergency SOS
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mt-3">
                  Get help immediately
                </h2>
                <p className="text-white/85 text-sm sm:text-base mt-2">
                  Sends your live location to dispatch an ambulance and notify
                  responders.
                </p>
              </div>

              <button
                onClick={handleSOS}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 bg-white text-red-600 px-6 py-3 rounded-2xl font-semibold shadow-sm hover:bg-white/95 transition disabled:opacity-70"
              >
                {loading ? "Requesting..." : "Send SOS"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* GRID */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT: Prebook + Consultation */}
          <div className="lg:col-span-2 space-y-6">
            <Card
              title="Pre-booked ambulance"
              icon={<Ambulance className="w-5 h-5 text-blue-600" />}
              right={
                loadingBooking ? (
                  <StatusPill>Loading</StatusPill>
                ) : booking ? (
                  <StatusPill
                    tone={
                      booking.status === "dispatched"
                        ? "purple"
                        : booking.status === "pending"
                          ? "yellow"
                          : "gray"
                    }
                  >
                    {String(booking.status || "status").toUpperCase()}
                  </StatusPill>
                ) : (
                  <StatusPill tone="gray">None</StatusPill>
                )
              }
            >
              {loadingBooking ? (
                <div className="space-y-3">
                  <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
                  <div className="h-9 w-32 bg-gray-100 rounded-xl animate-pulse" />
                </div>
              ) : !booking ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      Schedule an ambulance in advance for peace of mind.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                      <CalendarClock className="w-4 h-4" />
                      Choose pickup + time
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/patient/prebook")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    Pre-book
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                      <p className="text-xs font-semibold text-gray-500">
                        Pickup
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {booking.pickupLocation?.address || "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                      <p className="text-xs font-semibold text-gray-500">
                        Scheduled
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {booking.scheduledAt
                          ? new Date(booking.scheduledAt).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone="yellow">⏱ {getTimeLeft()}</StatusPill>
                    {(booking.status === "pending" ||
                      booking.status === "dispatched") && (
                      <button
                        onClick={handleCancel}
                        className="inline-flex items-center justify-center rounded-xl bg-red-600 text-white px-4 py-2 text-sm font-semibold hover:bg-red-700 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Card>

            <Card
              title="Online consultation"
              icon={<Video className="w-5 h-5 text-purple-600" />}
              right={
                consultation ? (
                  <StatusPill
                    tone={
                      consultation.status === "accepted"
                        ? "green"
                        : consultation.status === "booked"
                          ? "yellow"
                          : "gray"
                    }
                  >
                    {String(consultation.status).toUpperCase()}
                  </StatusPill>
                ) : (
                  <StatusPill tone="gray">None</StatusPill>
                )
              }
            >
              {!consultation ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      Book a video consultation with a hospital doctor.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                      <Stethoscope className="w-4 h-4" />
                      Choose specialty, doctor, and slot
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/consultation/book")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 text-white px-4 py-2 text-sm font-semibold hover:bg-purple-700 transition"
                  >
                    Book
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : consultation?.status === "booked" ? (
                <div className="space-y-3">
                  <p className="text-sm text-amber-800">
                    Waiting for the doctor to accept your request.
                  </p>
                  {consultation?.scheduledAt && (
                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                      <p className="text-xs font-semibold text-amber-800/80">
                        Scheduled slot
                      </p>
                      <p className="text-sm font-semibold text-amber-900 mt-1">
                        {consultation.scheduledAt}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleCancelConsultation}
                    className="inline-flex items-center justify-center rounded-xl bg-red-600 text-white px-4 py-2 text-sm font-semibold hover:bg-red-700 transition"
                  >
                    Cancel appointment
                  </button>
                </div>
              ) : consultation?.status === "accepted" ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                    <p className="text-xs font-semibold text-emerald-800/80">
                      Scheduled slot
                    </p>
                    <p className="text-sm font-semibold text-emerald-900 mt-1">
                      {joinState.slotText || consultation.scheduledAt || "—"}
                    </p>
                    {!joinState.canJoin && (
                      <p className="text-xs text-emerald-800 mt-1">
                        Join will unlock at the scheduled time.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleJoin}
                      disabled={!joinState.canJoin}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60 disabled:hover:bg-emerald-600"
                    >
                      Join call
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelConsultation}
                      className="inline-flex items-center justify-center rounded-xl bg-red-600 text-white px-4 py-2 text-sm font-semibold hover:bg-red-700 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">No active consultation.</p>
              )}
            </Card>
          </div>

          {/* RIGHT: AI Suggestions */}
          <div className="space-y-6">
            <AISuggestions handleSOS={handleSOS} />
          </div>
        </div>

      </div>
    </div>
  );
}
