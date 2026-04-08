import { useState } from "react";
import api from "../services/api";

export default function AISuggestions() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGetSuggestions = async () => {
    console.log("BUTTON CLICKED"); // ✅ debug

    if (!text.trim()) {
      alert("Please enter symptoms");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/ai/suggest", { text });

      console.log("API RESPONSE:", res.data); // ✅ debug

      setResult(res.data);
    } catch (err) {
      console.error("AI Error:", err);
      alert("Failed to get AI suggestions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="font-semibold mb-2">AI Suggestions</h2>

      {/* INPUT */}
      <input
        type="text"
        placeholder="Describe symptoms..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full border p-2 rounded mb-3"
      />

      {/* BUTTON */}
      <button
        onClick={handleGetSuggestions} // ✅ IMPORTANT
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Analyzing..." : "Get Suggestions"}
      </button>

      {/* RESULT */}
      {result && (
        <div className="mt-4 p-3 border rounded bg-gray-50">
          <p>
            <b>Severity:</b> {result.severity_level}
          </p>
          <p>
            <b>Action:</b> {result.recommended_action}
          </p>
          <p>
            <b>Advice:</b> {result.remedies}
          </p>
        </div>
      )}
    </div>
  );
}
