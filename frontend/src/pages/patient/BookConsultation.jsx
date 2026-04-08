import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function BookConsultation() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");

  // 🔥 NEW: multiple hospitals
  const [hospitals, setHospitals] = useState([]);

  const [hospital, setHospital] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [specialtiesLoading, setSpecialtiesLoading] = useState(false);
  const [specialtiesError, setSpecialtiesError] = useState("");

  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [doctors, setDoctors] = useState([]);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");

  const [loading, setLoading] = useState(false);

  // =======================
  // 🔍 SEARCH HOSPITAL
  // =======================
  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      const res = await api.get(
        `/auth/hospital/search?name=${encodeURIComponent(query)}`,
      );

      setHospitals(res.data); // ✅ array
      setHospital(null); // reset selected
      setSpecialties([]);
      setSpecialtiesLoading(false);
      setSpecialtiesError("");

      // reset flow
      setSelectedSpecialty("");
      setDoctors([]);
      setSelectedDoctor(null);
      setSelectedSlot("");
    } catch (err) {
      alert("No hospitals found");
      setHospitals([]);
    }
  };

  // =======================
  // 👨‍⚕️ FETCH DOCTORS
  // =======================
  useEffect(() => {
    if (!selectedSpecialty || !hospital) return;

    const fetchDoctors = async () => {
      try {
        const res = await api.get(
          `/auth/hospital/${hospital._id}/doctors?specialty=${selectedSpecialty}`,
        );

        setDoctors(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchDoctors();
  }, [selectedSpecialty, hospital]);

  // =======================
  // 📤 BOOK CONSULTATION
  // =======================
  const handleBooking = async () => {
    if (!selectedDoctor || !selectedSlot) {
      return alert("⚠️ Select doctor and slot");
    }

    try {
      setLoading(true);

      await api.post("/consultation/book", {
        hospitalId: hospital._id,
        doctor: {
          name: selectedDoctor.name,
          specialty: selectedDoctor.specialty,
        },
        scheduledAt: selectedSlot,
      });

      alert("✅ Consultation booked");

      navigate("/patient/dashboard");
    } catch (err) {
      console.error(err);
      alert("❌ Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📹 Book Consultation</h1>

      {/* 🔍 SEARCH */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Enter hospital name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          className="border p-2 w-full rounded"
        />

        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Search
        </button>
      </div>

      {/* 🔥 CLICKABLE HOSPITAL LIST */}
      {hospitals.length > 0 && (
        <div className="border rounded mb-6">
          {hospitals.map((h) => (
            <div
              key={h._id}
              onClick={async () => {
                setHospital(h);
                setHospitals([]); // hide list after selection

                // reset flow for new hospital
                setSelectedSpecialty("");
                setDoctors([]);
                setSelectedDoctor(null);
                setSelectedSlot("");
                setSpecialties([]);
                setSpecialtiesError("");
                setSpecialtiesLoading(true);

                try {
                  const res = await api.get(
                    `/auth/hospital/${h._id}/specialties`,
                  );
                  setSpecialties(Array.isArray(res.data) ? res.data : []);
                } catch (err) {
                  console.error(err);
                  setSpecialtiesError(
                    err.response?.data?.message ||
                      "Failed to load specialties for this hospital",
                  );
                  setSpecialties([]);
                } finally {
                  setSpecialtiesLoading(false);
                }
              }}
              className="p-3 border-b cursor-pointer hover:bg-gray-100"
            >
              <p className="font-semibold">{h.hospitalName}</p>
              <p className="text-sm text-gray-500">{h.location}</p>
            </div>
          ))}
        </div>
      )}

      {/* 🏥 SELECTED HOSPITAL */}
      {hospital && (
        <div className="mb-6 p-4 border rounded bg-green-50">
          <h2 className="font-bold text-lg">{hospital.hospitalName}</h2>
          <p className="text-sm text-gray-600">{hospital.location}</p>
        </div>
      )}

      {/* 🧬 SPECIALTIES */}
      {hospital && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Select Specialty</h3>

          {specialtiesLoading ? (
            <p className="text-sm text-gray-500">Loading specialties...</p>
          ) : specialtiesError ? (
            <p className="text-sm text-red-600">{specialtiesError}</p>
          ) : specialties.length === 0 ? (
            <p className="text-sm text-gray-500">
              No specialties found for this hospital. Ask the hospital to update
              their profile.
            </p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {specialties.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedSpecialty(s)}
                  className={`px-3 py-1 border rounded ${
                    selectedSpecialty === s ? "bg-blue-600 text-white" : ""
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 👨‍⚕️ DOCTORS */}
      {doctors.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Select Doctor</h3>

          {doctors.map((doc, i) => (
            <div
              key={i}
              className={`p-3 border rounded mb-2 cursor-pointer ${
                selectedDoctor?.name === doc.name ? "bg-green-100" : ""
              }`}
              onClick={() => setSelectedDoctor(doc)}
            >
              <p className="font-bold">{doc.name}</p>
              <p>{doc.specialty}</p>
            </div>
          ))}
        </div>
      )}

      {/* 🕒 SLOTS */}
      {selectedDoctor && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Select Time Slot</h3>

          <div className="flex gap-2 flex-wrap">
            {selectedDoctor.availableSlots.map((slot, i) => (
              <button
                key={i}
                onClick={() => setSelectedSlot(slot)}
                className={`px-3 py-1 border rounded ${
                  selectedSlot === slot ? "bg-purple-600 text-white" : ""
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 📤 BOOK */}
      {selectedSlot && (
        <button
          onClick={handleBooking}
          disabled={loading}
          className={`px-4 py-2 text-white rounded ${
            loading ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {loading ? "Booking..." : "Book Consultation"}
        </button>
      )}
    </div>
  );
}
