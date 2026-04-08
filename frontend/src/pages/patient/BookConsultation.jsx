import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Video, Search, MapPin, Stethoscope, Clock, User, CheckCircle, ArrowRight } from "lucide-react";

function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, idx) => {
        const isActive = idx <= currentStep;
        const isCompleted = idx < currentStep;
        return (
          <div key={idx} className="flex items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                isCompleted
                  ? "bg-emerald-600 text-white"
                  : isActive
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {isCompleted ? <CheckCircle size={20} /> : idx + 1}
            </div>
            <p className={`text-sm font-medium ml-3 ${isActive ? "text-gray-900" : "text-gray-500"}`}>
              {step}
            </p>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-3 transition ${
                  isCompleted ? "bg-emerald-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function BookConsultation() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
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

  // Determine current step
  const getCurrentStep = () => {
    if (hospital) return 1;
    return 0;
  };

  const getMaxStep = () => {
    if (selectedSlot) return 3;
    if (selectedDoctor) return 2;
    if (selectedSpecialty) return 1;
    if (hospital) return 0;
    return -1;
  };

  // =======================
  // 🔍 SEARCH HOSPITAL
  // =======================
  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      const res = await api.get(
        `/auth/hospital/search?name=${encodeURIComponent(query)}`,
      );

      setHospitals(res.data);
      setHospital(null);
      setSpecialties([]);
      setSpecialtiesError("");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Video size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Book Video Consultation</h1>
              <p className="text-blue-100 text-sm mt-1">Schedule a consultation with a specialist doctor</p>
            </div>
          </div>
        </div>

        {/* PROGRESS STEPS */}
        {hospital && (
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6">
            <StepIndicator
              steps={["Hospital", "Specialty", "Doctor", "Slot"]}
              currentStep={getMaxStep()}
            />
          </div>
        )}

        {/* SEARCH HOSPITAL SECTION */}
        {!hospital ? (
          <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-white/60 shadow-sm rounded-2xl p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <MapPin className="text-blue-600" size={24} />
                Find Hospital
              </h2>
              <p className="text-gray-600 text-sm">Search for a hospital to start booking your consultation</p>
            </div>

            <div className="flex gap-3">
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
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />

              <button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg"
              >
                <Search size={18} />
                Search
              </button>
            </div>

            {/* HOSPITAL LIST */}
            {hospitals.length > 0 && (
              <div className="mt-6 space-y-3">
                {hospitals.map((h) => (
                  <div
                    key={h._id}
                    onClick={async () => {
                      setHospital(h);
                      setHospitals([]);
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
                    className="p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{h.hospitalName}</p>
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                          <MapPin size={14} />
                          {h.location}
                        </p>
                      </div>
                      <ArrowRight className="text-blue-600 mt-1" size={20} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* SELECTED HOSPITAL */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{hospital.hospitalName}</h2>
                  <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                    <MapPin size={16} className="text-emerald-600" />
                    {hospital.location}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setHospital(null);
                    setQuery("");
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Change
                </button>
              </div>
            </div>

            {/* SPECIALTIES */}
            {specialtiesLoading ? (
              <div className="bg-white/80 backdrop-blur rounded-2xl p-8 text-center">
                <p className="text-gray-600 font-medium">Loading specialties...</p>
              </div>
            ) : specialtiesError ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700">
                {specialtiesError}
              </div>
            ) : specialties.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-yellow-800">
                <p className="font-medium">No specialties found</p>
                <p className="text-sm mt-1">Ask the hospital to update their profile with services</p>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-white/60 shadow-sm rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Stethoscope className="text-blue-600" size={20} />
                  Select Specialty
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {specialties.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedSpecialty(s)}
                      className={`px-4 py-3 rounded-lg font-medium text-sm transition border-2 ${
                        selectedSpecialty === s
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white border-gray-200 text-gray-700 hover:border-blue-400"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* DOCTORS */}
            {doctors.length > 0 && (
              <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-white/60 shadow-sm rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <User className="text-purple-600" size={20} />
                  Select Doctor
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((doc, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                        selectedDoctor?.name === doc.name
                          ? "border-purple-600 bg-purple-50"
                          : "border-gray-200 bg-white hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <User className="text-purple-600" size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-600">{doc.specialty}</p>
                        </div>
                        {selectedDoctor?.name === doc.name && (
                          <CheckCircle className="text-purple-600 flex-shrink-0" size={20} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TIME SLOTS */}
            {selectedDoctor && (
              <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-white/60 shadow-sm rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Clock className="text-amber-600" size={20} />
                  Select Time Slot
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {selectedDoctor.availableSlots && selectedDoctor.availableSlots.length > 0 ? (
                    selectedDoctor.availableSlots.map((slot, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-4 py-3 rounded-lg font-medium text-sm transition border-2 ${
                          selectedSlot === slot
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-white border-gray-200 text-gray-700 hover:border-amber-400"
                        }`}
                      >
                        {slot}
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm col-span-full">No slots available</p>
                  )}
                </div>
              </div>
            )}

            {/* BOOKING SUMMARY & BUTTON */}
            {selectedSlot && (
              <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-white/60 shadow-sm rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Hospital</span>
                    <span className="font-semibold text-gray-900">{hospital.hospitalName}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Specialty</span>
                    <span className="font-semibold text-gray-900">{selectedSpecialty}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Doctor</span>
                    <span className="font-semibold text-gray-900">{selectedDoctor.name}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Time Slot</span>
                    <span className="font-semibold text-gray-900">{selectedSlot}</span>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                >
                  <Video size={20} />
                  {loading ? "Booking..." : "Book Consultation"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
