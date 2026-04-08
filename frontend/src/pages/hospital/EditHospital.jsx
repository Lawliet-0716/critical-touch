import { useEffect, useState } from "react";
import api from "../../services/api";
import { Settings, Plus, Trash2, Clock, Users, Stethoscope } from "lucide-react";

export default function EditHospital() {
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [specialties, setSpecialties] = useState([]);

  const [doctorName, setDoctorName] = useState("");
  const [doctorSpecialty, setDoctorSpecialty] = useState("");
  const [slotInput, setSlotInput] = useState("");

  const [slots, setSlots] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔄 Load existing hospital data (prevents overwriting with empty arrays)
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get("/auth/hospital/me");
        const h = res.data?.hospital;
        setSpecialties(Array.isArray(h?.specialties) ? h.specialties : []);
        setDoctors(Array.isArray(h?.doctors) ? h.doctors : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  // ➕ Add specialty
  const addSpecialty = () => {
    const next = specialtyInput.trim();
    if (!next) return;
    if (specialties.includes(next)) return;
    setSpecialties([...specialties, next]);
    setSpecialtyInput("");
  };

  // ➖ Remove specialty
  const removeSpecialty = (index) => {
    setSpecialties(specialties.filter((_, i) => i !== index));
  };

  // ➕ Add slot
  const addSlot = () => {
    if (!slotInput) return;
    setSlots([...slots, slotInput]);
    setSlotInput("");
  };

  // ➖ Remove slot
  const removeSlot = (index) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  // ➕ Add doctor
  const addDoctor = () => {
    if (!doctorName || !doctorSpecialty) return;

    setDoctors([
      ...doctors,
      {
        name: doctorName,
        specialty: doctorSpecialty,
        availableSlots: slots,
      },
    ]);

    setDoctorName("");
    setDoctorSpecialty("");
    setSlots([]);
  };

  // ➖ Remove doctor
  const removeDoctor = (index) => {
    setDoctors(doctors.filter((_, i) => i !== index));
  };

  // 💾 Save to backend
  const handleSubmit = async () => {
    try {
      setSaving(true);
      await api.put("/auth/hospital/update", {
        specialties,
        doctors,
      });

      alert("Hospital updated successfully");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save hospital data");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Settings size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Edit Hospital Profile</h1>
              <p className="text-emerald-100 text-sm mt-1">Manage specialties, doctors, and consultation slots</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 text-center">
            <p className="text-gray-600 font-medium">Loading hospital data...</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {/* SPECIALTIES SECTION */}
            <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-white/60 shadow-sm rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Stethoscope className="text-blue-600" size={20} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Hospital Specialties</h2>
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addSpecialty()}
                  placeholder="e.g., Cardiology, Neurology, Orthopedics"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={addSpecialty}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 transition"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {specialties.length > 0 ? (
                  specialties.map((s, i) => (
                    <div
                      key={i}
                      className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-blue-700"
                    >
                      {s}
                      <button
                        onClick={() => removeSpecialty(i)}
                        className="ml-1 hover:text-red-600 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No specialties added yet</p>
                )}
              </div>
            </div>

            {/* ADD DOCTOR & SLOTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* DOCTOR INFO */}
              <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-white/60 shadow-sm rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Users className="text-purple-600" size={20} />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Doctor Information</h2>
                </div>

                <div className="space-y-3">
                  <input
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Doctor Name"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />

                  <input
                    value={doctorSpecialty}
                    onChange={(e) => setDoctorSpecialty(e.target.value)}
                    placeholder="Specialty (e.g., Cardiology)"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
              </div>

              {/* CONSULTATION SLOTS */}
              <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-white/60 shadow-sm rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Clock className="text-amber-600" size={20} />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Available Slots</h2>
                </div>

                <div className="flex gap-2 mb-3">
                  <input
                    value={slotInput}
                    onChange={(e) => setSlotInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addSlot()}
                    placeholder="e.g., 10:00 AM - 11:00 AM"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                  <button
                    onClick={addSlot}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {slots.length > 0 ? (
                    slots.map((s, i) => (
                      <div
                        key={i}
                        className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium text-amber-700"
                      >
                        {s}
                        <button
                          onClick={() => removeSlot(i)}
                          className="ml-1 hover:text-red-600 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">No slots added</p>
                  )}
                </div>
              </div>
            </div>

            {/* ADD DOCTOR BUTTON */}
            <div className="flex justify-center">
              <button
                onClick={addDoctor}
                disabled={!doctorName || !doctorSpecialty}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2 transition shadow-lg"
              >
                <Plus size={20} />
                Add Doctor
              </button>
            </div>

            {/* DOCTORS LIST */}
            <div className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-white/60 shadow-sm rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <Users className="text-green-600" size={20} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Doctors Added ({doctors.length})
                </h2>
              </div>

              <div className="space-y-3">
                {doctors.length > 0 ? (
                  doctors.map((d, i) => (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-green-50/50 to-emerald-50/50 hover:shadow-sm transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{d.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{d.specialty}</p>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {d.availableSlots.length > 0 ? (
                              d.availableSlots.map((slot, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium"
                                >
                                  {slot}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">No slots assigned</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeDoctor(i)}
                          className="text-red-600 hover:bg-red-50 p-2.5 rounded-lg transition"
                          title="Delete doctor"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No doctors added yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* SAVE BUTTON */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-xl transition shadow-lg"
              >
                {saving ? "Saving..." : "Save Hospital Profile"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
