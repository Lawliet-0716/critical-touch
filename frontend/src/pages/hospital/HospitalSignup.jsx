import { useState } from "react";
import { hospitalSignup } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import GoogleHospitalAutocomplete from "../../components/GoogleHospitalAutocomplete";

export default function HospitalSignup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    hospitalName: "",
    location: "", // 🔥 will store "lat,lng"
    contactNumber: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // =======================
  // ✅ VALIDATION
  // =======================
  const validate = () => {
    let newErrors = {};

    if (!form.hospitalName) {
      newErrors.hospitalName = "Select hospital from search";
    }

    if (!form.location) {
      newErrors.location = "Please select hospital from search";
    }

    if (!/^\d{10}$/.test(form.contactNumber)) {
      newErrors.contactNumber = "Must be 10 digits";
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Invalid email";
    }

    if (form.password.length < 6) {
      newErrors.password = "Minimum 6 characters";
    }

    return newErrors;
  };

  // =======================
  // 🚀 SUBMIT
  // =======================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    try {
      setLoading(true);

      await hospitalSignup(form);

      alert("🏥 Hospital registered successfully");

      navigate("/hospital/login");
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || "Signup failed",
      });
    } finally {
      setLoading(false);
    }
  };

  // =======================
  // UI
  // =======================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-gray-100 p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        {/* TITLE */}
        <h2 className="text-2xl font-bold text-center mb-6">
          🏥 Hospital Signup
        </h2>

        {/* GENERAL ERROR */}
        {errors.general && (
          <p className="text-red-500 text-sm mb-3 text-center">
            {errors.general}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 🔍 GOOGLE AUTOCOMPLETE */}
          <div>
            <GoogleHospitalAutocomplete
              onSelect={(data) => {
                setForm({
                  ...form,
                  hospitalName: data.hospitalName,
                  location: data.location,
                });
              }}
            />

            {form.hospitalName && (
              <p className="text-green-600 text-sm mt-2">
                ✔ {form.hospitalName}
              </p>
            )}

            {errors.location && (
              <p className="text-red-500 text-sm">{errors.location}</p>
            )}
          </div>

          {/* 📞 CONTACT */}
          <div>
            <input
              placeholder="Contact Number"
              value={form.contactNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                if (val.length <= 10) {
                  setForm({ ...form, contactNumber: val });
                }
              }}
              className="w-full border p-3 rounded-lg"
            />
            {errors.contactNumber && (
              <p className="text-red-500 text-sm">{errors.contactNumber}</p>
            )}
          </div>

          {/* 📧 EMAIL */}
          <div>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border p-3 rounded-lg"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
          </div>

          {/* 🔒 PASSWORD */}
          <div>
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border p-3 rounded-lg"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password}</p>
            )}
          </div>

          {/* 🚀 BUTTON */}
          <button
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-semibold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Creating..." : "Signup"}
          </button>
        </form>

        {/* LOGIN */}
        <p
          className="text-center mt-4 text-sm cursor-pointer hover:text-green-600"
          onClick={() => navigate("/hospital/login")}
        >
          Already registered? Login
        </p>
      </div>
    </div>
  );
}
