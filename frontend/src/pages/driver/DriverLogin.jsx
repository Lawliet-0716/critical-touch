import { useState } from "react";
import { driverSignin } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { User, Lock } from "lucide-react";

export default function DriverLogin() {
  const [form, setForm] = useState({
    licenseNumber: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await driverSignin(form);

      login(res.data.token);
      navigate("/driver/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        {/* 🚑 TITLE */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">🚑 Driver Login</h2>
          <p className="text-gray-500 text-sm">
            Access your ambulance dashboard
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* LICENSE */}
          <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-green-500">
            <User className="text-gray-400 mr-2" size={18} />
            <input
              type="text"
              placeholder="License Number"
              value={form.licenseNumber}
              onChange={(e) =>
                setForm({ ...form, licenseNumber: e.target.value })
              }
              required
              className="w-full outline-none"
            />
          </div>

          {/* PASSWORD */}
          <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-green-500">
            <Lock className="text-gray-400 mr-2" size={18} />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full outline-none"
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg font-semibold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* SIGNUP */}
        <p
          className="text-center text-sm text-gray-600 mt-4 cursor-pointer hover:text-green-600 transition"
          onClick={() => navigate("/driver/signup")}
        >
          New driver? Signup
        </p>
      </div>
    </div>
  );
}
