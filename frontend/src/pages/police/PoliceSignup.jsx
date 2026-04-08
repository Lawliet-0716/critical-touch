import { useState } from "react";
import { policeSignup } from "../../services/authService";
import { useNavigate } from "react-router-dom";

export default function PoliceSignup() {
  const [form, setForm] = useState({
    name: "",
    badgeNumber: "",
    station: "",
    phone: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    let newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name required";
    if (!form.badgeNumber.trim()) newErrors.badgeNumber = "Badge required";
    if (!form.station.trim()) newErrors.station = "Station required";

    if (!/^\d{10}$/.test(form.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    if (form.password.length < 6) {
      newErrors.password = "Min 6 characters";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await policeSignup(form);
      alert("Police registered 🚓");
      navigate("/police/login");
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || "Signup failed",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          🚓 Police Signup
        </h2>

        {errors.general && (
          <p className="text-red-500 text-sm">{errors.general}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            placeholder="Name"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
          />
          <input
            name="badgeNumber"
            placeholder="Badge Number"
            onChange={(e) => setForm({ ...form, badgeNumber: e.target.value })}
            className="input"
          />
          <input
            name="station"
            placeholder="Station"
            onChange={(e) => setForm({ ...form, station: e.target.value })}
            className="input"
          />

          <input
            name="phone"
            placeholder="Phone"
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              if (val.length <= 10) setForm({ ...form, phone: val });
            }}
            className="input"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input"
          />

          <button className="w-full bg-blue-600 text-white py-2 rounded-lg">
            Signup
          </button>
        </form>

        <p
          className="text-center text-sm mt-4 cursor-pointer hover:text-blue-600"
          onClick={() => navigate("/police/login")}
        >
          Already registered? Login
        </p>
      </div>
    </div>
  );
}
