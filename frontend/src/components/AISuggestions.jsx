import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function AISuggestions() {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-2xl shadow-lg text-white">
      {/* ICON + TITLE */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-white text-green-600 p-2 rounded-full">
          <Sparkles size={20} />
        </div>
        <h2 className="text-lg font-semibold">AI Health Assistant</h2>
      </div>

      {/* DESCRIPTION */}
      <p className="text-sm text-green-100 mb-5">
        Describe your symptoms and get instant medical guidance powered by AI.
      </p>

      {/* BUTTON */}
      <button
        onClick={() => navigate("/patient/ai")}
        className="w-full bg-white text-green-600 font-semibold py-2 rounded-lg hover:bg-gray-100 transition duration-200"
      >
        🤖 Start AI Consultation
      </button>
    </div>
  );
}
