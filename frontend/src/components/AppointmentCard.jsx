import { useEffect, useMemo, useState } from "react";

export default function AppointmentCard({ consultation, role, onAccept }) {
  if (!consultation) return null;

  const [nowTick, setNowTick] = useState(0);

  const joinState = useMemo(() => {
    const slot = consultation?.scheduledAt;
    if (!slot) return { canJoin: false, slotText: null };

    const m = String(slot)
      .trim()
      .match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);

    if (!m) return { canJoin: true, slotText: slot }; // unknown format → don't block

    let hours = Number(m[1]);
    const minutes = Number(m[2] ?? "0");
    const ampm = m[3].toUpperCase();

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return { canJoin: true, slotText: slot };
    }

    hours = hours % 12;
    if (ampm === "PM") hours += 12;

    const scheduled = new Date();
    scheduled.setSeconds(0, 0);
    scheduled.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const closeAfterMin = 45;
    const closeAt = new Date(scheduled.getTime() + closeAfterMin * 60 * 1000);

    return { canJoin: now >= scheduled && now <= closeAt, slotText: slot };
  }, [consultation?.scheduledAt, nowTick]);

  useEffect(() => {
    if (!consultation?.scheduledAt) return;
    const id = setInterval(() => setNowTick((x) => x + 1), 15_000);
    return () => clearInterval(id);
  }, [consultation?.scheduledAt]);

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4 border">
      {/* ======================= */}
      {/* HEADER */}
      {/* ======================= */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">📹 Consultation</h2>

        <span
          className={`px-2 py-1 text-sm rounded ${
            consultation.status === "booked"
              ? "bg-yellow-200"
              : consultation.status === "accepted"
                ? "bg-green-200"
                : "bg-gray-200"
          }`}
        >
          {consultation.status}
        </span>
      </div>

      {/* ======================= */}
      {/* DETAILS */}
      {/* ======================= */}
      <div className="text-sm space-y-1">
        <p>
          <strong>Patient:</strong> {consultation.patient?.name || "N/A"}
        </p>

        <p>
          <strong>Doctor:</strong> {consultation.doctor?.name || "N/A"}
        </p>

        <p>
          <strong>Specialty:</strong> {consultation.doctor?.specialty || "N/A"}
        </p>

        <p>
          <strong>Time:</strong> {consultation.scheduledAt}
        </p>
      </div>

      {/* ======================= */}
      {/* ACTIONS */}
      {/* ======================= */}
      <div className="mt-4 flex gap-2">
        {/* 🏥 HOSPITAL ACCEPT */}
        {role === "hospital" && consultation.status === "booked" && (
          <button
            onClick={() => onAccept(consultation._id)}
            className="bg-green-600 text-white px-3 py-1 rounded"
          >
            Accept
          </button>
        )}

        {/* 🎥 JOIN CALL */}
        {consultation.status === "accepted" && (
          <>
            {!joinState.canJoin ? (
              <span className="text-sm text-gray-700">
                Scheduled at: {joinState.slotText || consultation.scheduledAt}
              </span>
            ) : (
              <button
                onClick={() =>
                  (window.location.href = `/consultation/${consultation._id}`)
                }
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                Join Call
              </button>
            )}
          </>
        )}

        {/* ✅ COMPLETED */}
        {consultation.status === "completed" && (
          <span className="text-gray-500">Completed</span>
        )}
      </div>
    </div>
  );
}
