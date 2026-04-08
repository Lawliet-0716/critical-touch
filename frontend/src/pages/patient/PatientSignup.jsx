import { useState } from "react";
import { signup } from "../../services/authService";
import { useNavigate } from "react-router-dom";

export default function PatientSignup() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    bloodGroup: "",
    phone: "",
    emergencyContact: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    let newErrors = {};

    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!form.age || form.age <= 0) newErrors.age = "Enter valid age";
    if (!form.gender) newErrors.gender = "Select gender";
    if (!form.bloodGroup) newErrors.bloodGroup = "Select blood group";
    if (!/^\d{10}$/.test(form.phone))
      newErrors.phone = "Phone number must be 10 digits";
    if (!/^\d{10}$/.test(form.emergencyContact))
      newErrors.emergencyContact = "Emergency contact must be 10 digits";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = "Invalid email";
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
      await signup({ ...form, role: "patient" });
      alert("Signup successful");
      navigate("/patient/login");
    } catch (err) {
      const backendError = err.response?.data;

      if (backendError?.errors) {
        // Mongoose validation errors
        const newErrors = {};
        for (let key in backendError.errors) {
          newErrors[key] = backendError.errors[key].message;
        }
        setErrors(newErrors);
      } else if (backendError?.message) {
        // General error (like email already exists)
        setErrors({ general: backendError.message });
      } else {
        setErrors({ general: "Signup failed" });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-3xl">
        <h2 className="text-2xl font-bold text-center mb-6">Patient Signup</h2>
        {errors.general && (
          <div className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm">
            {errors.general}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* First Name */}
          <div>
            <label className="label">First Name</label>
            <input name="firstName" onChange={handleChange} className="input" />
            <p className="error">{errors.firstName}</p>
          </div>

          {/* Last Name */}
          <div>
            <label className="label">Last Name</label>
            <input name="lastName" onChange={handleChange} className="input" />
            <p className="error">{errors.lastName}</p>
          </div>

          {/* Age */}
          <div>
            <label className="label">Age</label>
            <input
              type="number"
              name="age"
              onChange={handleChange}
              className="input"
            />
            <p className="error">{errors.age}</p>
          </div>

          {/* Gender */}
          <div>
            <label className="label">Gender</label>
            <select name="gender" onChange={handleChange} className="input">
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
            <p className="error">{errors.gender}</p>
          </div>

          {/* Blood Group */}
          <div>
            <label className="label">Blood Group</label>
            <select name="bloodGroup" onChange={handleChange} className="input">
              <option value="">Select Blood Group</option>
              <option>A+</option>
              <option>A-</option>
              <option>B+</option>
              <option>B-</option>
              <option>AB+</option>
              <option>AB-</option>
              <option>O+</option>
              <option>O-</option>
            </select>
            <p className="error">{errors.bloodGroup}</p>
          </div>

          {/* Phone */}
          <div>
            <label className="label">Phone Number</label>
            <input
              name="phone"
              value={form.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ""); // only digits
                if (value.length <= 10) {
                  setForm({ ...form, phone: value });
                }
              }}
              className="input"
            />
            <p className="error">{errors.phone}</p>
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="label">Emergency Contact</label>
            <input
              name="emergencyContact"
              value={form.emergencyContact}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 10) {
                  setForm({ ...form, emergencyContact: value });
                }
              }}
              className="input"
            />
            <p className="error">{errors.emergencyContact}</p>
          </div>

          {/* Email */}
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              name="email"
              onChange={handleChange}
              className="input"
            />
            <p className="error">{errors.email}</p>
          </div>

          {/* Password */}
          <div className="md:col-span-2">
            <label className="label">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              className="input"
            />
            <p className="error">{errors.password}</p>
          </div>

          {/* Button full width */}
          <div className="md:col-span-2">
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
              Signup
            </button>
          </div>
        </form>

        <p
          className="text-center text-sm text-gray-600 mt-4 cursor-pointer hover:text-blue-600"
          onClick={() => navigate("/patient/login")}
        >
          Already have an account? Login
        </p>
      </div>
    </div>
  );
}
