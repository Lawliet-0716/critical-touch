import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { SendHorizonal } from "lucide-react";

export default function AIPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSOS = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await api.post("/emergency/request", {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });

          const emergency = res.data.emergency;

          localStorage.setItem("emergency", JSON.stringify(emergency));

          navigate("/patient/emergency", {
            state: { emergency },
          });
        } catch (err) {
          alert("SOS failed");
        }
      },
      () => alert("Location error"),
      { enableHighAccuracy: true },
    );
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    try {
      setLoading(true);

      const res = await api.post("/ai/suggest", { text: input });

      const aiMsg = {
        sender: "ai",
        text: `${res.data.recommended_action}\n${res.data.remedies}`,
        sos: res.data.sos_trigger,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-gradient-to-br from-slate-50 to-gray-100">
      {/* HEADER */}
      <div className="bg-white shadow p-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">
          🤖 AI Medical Assistant
        </h1>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-lg">💬 Start your conversation</p>
            <p className="text-sm">
              Ask about symptoms, first aid, or health advice
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-md px-4 py-3 rounded-2xl shadow ${
                msg.sender === "user"
                  ? "bg-green-500 text-white rounded-br-none"
                  : "bg-white text-gray-800 rounded-bl-none"
              }`}
            >
              <p className="whitespace-pre-line text-sm">{msg.text}</p>

              {/* 🚑 SOS */}
              {msg.sos && (
                <button
                  className="mt-3 bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700"
                  onClick={() => {
                    const confirmSOS = window.confirm(
                      "🚨 Emergency detected!\nCall ambulance?",
                    );
                    if (confirmSOS) handleSOS();
                  }}
                >
                  🚑 Call Ambulance
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && <p className="text-gray-400 text-sm">AI is thinking...</p>}
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white border-t flex items-center gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your symptoms..."
          className="flex-1 border rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-green-400"
        />

        <button
          onClick={sendMessage}
          className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition"
        >
          <SendHorizonal size={20} />
        </button>
      </div>
    </div>
  );
}
