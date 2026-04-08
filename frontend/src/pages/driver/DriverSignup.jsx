import { useState } from "react";
import { driverSignup } from "../../services/authService";
import { useNavigate } from "react-router-dom";

export default function DriverSignup() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    licenseNumber: "",
    ambulanceNumber: "",
    ambulanceType: "BASIC",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    let newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";

    if (!/^\d{10}$/.test(form.phone)) {
      newErrors.phone = "Phone number must be 10 digits";
    }

    if (!form.licenseNumber.trim()) {
      newErrors.licenseNumber = "License number is required";
    }

    if (!form.ambulanceNumber.trim()) {
      newErrors.ambulanceNumber = "Ambulance number is required";
    }

    if (!form.ambulanceType) {
      newErrors.ambulanceType = "Ambulance type is required";
    }

    if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await driverSignup({ ...form, role: "driver" });
      alert("Driver registered successfully 🚑");
      navigate("/driver/login");
    } catch (err) {
      const backendError = err.response?.data;

      if (backendError?.errors) {
        const newErrors = {};
        for (let key in backendError.errors) {
          newErrors[key] = backendError.errors[key].message;
        }
        setErrors(newErrors);
      } else if (backendError?.message) {
        setErrors({ general: backendError.message });
      } else {
        setErrors({ general: "Signup failed" });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-center mb-6">
          🚑 Driver Signup
        </h2>

        {errors.general && (
          <div className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input
              name="name"
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-red-500 text-sm">{errors.name}</p>
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium">Phone Number</label>
            <input
              name="phone"
              value={form.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 10) {
                  setForm({ ...form, phone: value });
                }
              }}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-red-500 text-sm">{errors.phone}</p>
          </div>

          {/* License */}
          <div>
            <label className="text-sm font-medium">License Number</label>
            <input
              name="licenseNumber"
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-red-500 text-sm">{errors.licenseNumber}</p>
          </div>

          {/* Ambulance Number */}
          <div>
            <label className="text-sm font-medium">Ambulance Number</label>
            <input
              name="ambulanceNumber"
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-red-500 text-sm">{errors.ambulanceNumber}</p>
          </div>

          {/* Ambulance Type */}
          <div>
            <label className="text-sm font-medium">Ambulance Type</label>
            <select
              name="ambulanceType"
              value={form.ambulanceType}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="BASIC">BASIC</option>
              <option value="ADVANCED">ADVANCED</option>
              <option value="ICU">ICU</option>
            </select>
            <p className="text-red-500 text-sm">{errors.ambulanceType}</p>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-red-500 text-sm">{errors.password}</p>
          </div>

          {/* Button */}
          <button className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition">
            Signup
          </button>
        </form>

        <p
          className="text-center text-sm text-gray-600 mt-4 cursor-pointer hover:text-red-600"
          onClick={() => navigate("/driver/login")}
        >
          Already a driver? Login
        </p>
      </div>
    </div>
  );
}
