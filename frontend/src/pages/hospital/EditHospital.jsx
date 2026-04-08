import { useEffect, useState } from "react";
import api from "../../services/api";

export default function EditHospital() {
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [specialties, setSpecialties] = useState([]);

  const [doctorName, setDoctorName] = useState("");
  const [doctorSpecialty, setDoctorSpecialty] = useState("");
  const [slotInput, setSlotInput] = useState("");

  const [slots, setSlots] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // ➕ Add slot
  const addSlot = () => {
    if (!slotInput) return;
    setSlots([...slots, slotInput]);
    setSlotInput("");
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

  // 💾 Save to backend
  const handleSubmit = async () => {
    try {
      await api.put("/auth/hospital/update", {
        specialties,
        doctors,
      });

      alert("Hospital updated successfully");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save hospital data");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Hospital</h1>

      {loading && <p className="text-sm text-gray-500 mb-4">Loading...</p>}

      {/* SPECIALTIES */}
      <div className="mb-6">
        <h2 className="font-semibold">Specialties</h2>
        <input
          value={specialtyInput}
          onChange={(e) => setSpecialtyInput(e.target.value)}
          className="border p-2 mr-2"
          placeholder="e.g Cardiology"
        />
        <button
          onClick={addSpecialty}
          className="bg-blue-500 text-white px-3 py-1"
        >
          Add
        </button>

        <div className="mt-2">
          {specialties.map((s, i) => (
            <span key={i} className="mr-2 bg-gray-200 px-2 py-1">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* DOCTOR */}
      <div className="mb-6">
        <h2 className="font-semibold">Add Doctor</h2>

        <input
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
          placeholder="Doctor Name"
          className="border p-2 mr-2"
        />

        <input
          value={doctorSpecialty}
          onChange={(e) => setDoctorSpecialty(e.target.value)}
          placeholder="Specialty"
          className="border p-2 mr-2"
        />

        {/* SLOTS */}
        <div className="mt-2">
          <input
            value={slotInput}
            onChange={(e) => setSlotInput(e.target.value)}
            placeholder="Slot (e.g 10:00 AM)"
            className="border p-2 mr-2"
          />
          <button onClick={addSlot} className="bg-green-500 text-white px-2">
            Add Slot
          </button>
        </div>

        <div className="mt-2">
          {slots.map((s, i) => (
            <span key={i} className="mr-2 bg-yellow-200 px-2">
              {s}
            </span>
          ))}
        </div>

        <button
          onClick={addDoctor}
          className="bg-purple-500 text-white mt-3 px-3 py-1"
        >
          Add Doctor
        </button>
      </div>

      {/* DOCTOR LIST */}
      <div className="mb-6">
        <h2 className="font-semibold">Doctors Added</h2>
        {doctors.map((d, i) => (
          <div key={i} className="border p-2 mt-2">
            <p>{d.name}</p>
            <p>{d.specialty}</p>
            <p>{d.availableSlots.join(", ")}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="bg-red-600 text-white px-4 py-2"
      >
        Save Hospital Data
      </button>
    </div>
  );
}
