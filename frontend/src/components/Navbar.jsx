import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Activity, LogIn, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-gradient-to-r from-sky-700 via-blue-600 to-indigo-700 text-white px-6 py-4 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-3 rounded-3xl bg-white/10 px-4 py-3 transition hover:bg-white/15"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white/15 ring-1 ring-white/20">
            <Activity className="text-white" size={24} />
          </div>
          <div className="text-left">
            <p className="text-xl font-semibold tracking-tight">Critical Touch</p>
            <p className="text-sm text-sky-100/80">Smart emergency response</p>
          </div>
        </button>

        <div className="flex items-center gap-3">
          {!user ? (
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-lg shadow-sky-800/20 transition hover:bg-slate-100"
            >
              <LogIn size={18} />
              Login
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-3">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
