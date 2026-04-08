import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function EditPatient() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    uhid: "",
    firstName: "",
    lastName: "",
    age: "",
    gender: "Male",
    bloodGroup: "",
    phone: "",
    emergencyContact: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/auth/patient/me");
        const p = res.data?.patient;
        setForm({
          uhid: p?.uhid || "",
          firstName: p?.firstName || "",
          lastName: p?.lastName || "",
          age: typeof p?.age === "number" ? String(p.age) : "",
          gender: p?.gender || "Male",
          bloodGroup: p?.bloodGroup || "",
          phone: p?.phone || "",
          emergencyContact: p?.emergencyContact || "",
        });
      } catch (err) {
        console.error(err);
        alert("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const onChange = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSave = async () => {
    try {
      setSaving(true);
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        age: form.age === "" ? "" : Number(form.age),
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        phone: form.phone,
        emergencyContact: form.emergencyContact,
      };
      await api.put("/auth/patient/update", payload);
      alert("✅ Profile updated");
      navigate("/patient/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Edit Profile</h1>
          <button
            onClick={() => navigate("/patient/dashboard")}
            className="text-sm text-gray-600 hover:underline"
          >
            Back
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">UHID</label>
            <input
              value={form.uhid}
              className="w-full border rounded-lg p-2 bg-gray-50"
              disabled
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">First name</label>
            <input
              value={form.firstName}
              onChange={onChange("firstName")}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Last name</label>
            <input
              value={form.lastName}
              onChange={onChange("lastName")}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Age</label>
            <input
              value={form.age}
              onChange={onChange("age")}
              className="w-full border rounded-lg p-2"
              inputMode="numeric"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Gender</label>
            <select
              value={form.gender}
              onChange={onChange("gender")}
              className="w-full border rounded-lg p-2"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Blood group</label>
            <input
              value={form.bloodGroup}
              onChange={onChange("bloodGroup")}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Phone</label>
            <input
              value={form.phone}
              onChange={onChange("phone")}
              className="w-full border rounded-lg p-2"
              inputMode="numeric"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Emergency contact</label>
            <input
              value={form.emergencyContact}
              onChange={onChange("emergencyContact")}
              className="w-full border rounded-lg p-2"
              inputMode="numeric"
            />
          </div>

          <button
            onClick={onSave}
            disabled={saving}
            className={`w-full py-2 rounded-lg text-white ${
              saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

