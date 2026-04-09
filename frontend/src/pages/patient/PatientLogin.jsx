import { useState } from "react";
import { signin } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function PatientLogin() {
  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const [loginType, setLoginType] = useState("email");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signin({
        identifier: form.identifier,
        password: form.password,
      });

      // ✅ FIX: pass full patient data
      login(res.data.token);
      navigate("/patient/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2">Patient Login</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Access your emergency dashboard
        </p>

        {/* Toggle */}
        <div className="flex bg-gray-200 rounded-full p-1 mb-5">
          <button
            type="button"
            onClick={() => setLoginType("email")}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
              loginType === "email" ? "bg-blue-600 text-white" : "text-gray-600"
            }`}
          >
            Email
          </button>

          <button
            type="button"
            onClick={() => setLoginType("uhid")}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
              loginType === "uhid" ? "bg-blue-600 text-white" : "text-gray-600"
            }`}
          >
            UHID
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identifier */}
          <input
            type={loginType === "email" ? "email" : "text"}
            placeholder={
              loginType === "email" ? "Enter your email" : "Enter your UHID"
            }
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg font-semibold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Signup */}
        <p
          className="text-center text-sm text-gray-600 mt-4 cursor-pointer hover:text-blue-600 transition"
          onClick={() => navigate("/patient/signup")}
        >
          New user? Signup
        </p>
      </div>
    </div>
  );
}
