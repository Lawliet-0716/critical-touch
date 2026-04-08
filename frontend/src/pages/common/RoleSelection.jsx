import { useNavigate } from "react-router-dom";
import { HeartPulse, Ambulance, Shield, Hospital } from "lucide-react";

const ROLES = [
  {
    name: "Patient",
    path: "/patient/login",
    role: "patient",
    icon: <HeartPulse size={28} />,
    active: true,
    color: "from-red-500 to-rose-600",
  },
  {
    name: "Ambulance Driver",
    path: "/driver/login",
    role: "driver",
    icon: <Ambulance size={28} />,
    active: true,
    color: "from-amber-400 to-orange-500",
  },
  {
    name: "Traffic Police",
    path: "/police/login",
    role: "police",
    icon: <Shield size={28} />,
    active: true,
    color: "from-blue-500 to-indigo-600",
  },
  {
    name: "Hospital",
    path: "/hospital/login",
    role: "hospital",
    icon: <Hospital size={28} />,
    active: true,
    color: "from-emerald-500 to-green-600",
  },
];

export default function RoleSelection() {
  const navigate = useNavigate();

  const handleSelect = (role) => {
    if (!role.active) return;
    localStorage.setItem("role", role.role);
    navigate(role.path);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-red-50 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-blue-600 drop-shadow-sm">
          🚑 Critical Touch
        </h1>
        <p className="text-gray-600 mt-3 text-lg">
          Fast • Smart • Life-Saving Emergency Response
        </p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl w-full">
        {ROLES.map((role) => (
          <button
            key={role.role}
            onClick={() => handleSelect(role)}
            disabled={!role.active}
            className={`
              relative p-6 rounded-2xl text-white shadow-lg
              transition-all duration-300 transform
              hover:scale-105 hover:shadow-2xl
              bg-gradient-to-br ${role.color}
              ${!role.active && "opacity-50 cursor-not-allowed"}
            `}
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-2xl blur-xl opacity-30 bg-white"></div>

            {/* Content */}
            <div className="relative flex flex-col items-center gap-4">
              {/* Icon Container */}
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-md">
                {role.icon}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold">{role.name}</h3>

              {/* Disabled Tag */}
              {!role.active && (
                <span className="text-xs bg-white/30 px-2 py-1 rounded">
                  Coming Soon
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Footer Note */}
      <p className="mt-12 text-sm text-gray-500">
        Your safety, our priority ❤️
      </p>
    </div>
  );
}
