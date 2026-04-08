export default function AppointmentCard({ consultation, role, onAccept }) {
  if (!consultation) return null;

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
          <button
            onClick={() =>
              (window.location.href = `/consultation/${consultation._id}`)
            }
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Join Call
          </button>
        )}

        {/* ✅ COMPLETED */}
        {consultation.status === "completed" && (
          <span className="text-gray-500">Completed</span>
        )}
      </div>
    </div>
  );
}
