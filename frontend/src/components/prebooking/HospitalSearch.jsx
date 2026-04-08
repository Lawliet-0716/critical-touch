import { Autocomplete } from "@react-google-maps/api";
import { useRef, useState } from "react";

export default function HospitalSearch({ onSelect }) {
  const autoRef = useRef(null);
  console.log("HospitalSearch render");
  const [value, setValue] = useState("");
  const [selected, setSelected] = useState(false);
  const [error, setError] = useState("");

  const handlePlace = () => {
    const place = autoRef.current?.getPlace();

    // ❌ No selection from dropdown
    if (!place || !place.geometry) {
      setError("Please select a hospital from suggestions");
      setSelected(false);
      return;
    }

    // 🔒 Ensure it's a hospital
    if (!place.types?.includes("hospital")) {
      setError("Please select a valid hospital");
      setSelected(false);
      return;
    }

    const hospital = {
      address: place.formatted_address,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      name: place.name,
    };

    setValue(place.formatted_address);
    setSelected(true);
    setError("");

    // ✅ Send to parent
    onSelect(hospital);
  };

  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2">🏥 Select Hospital</h3>

      <Autocomplete
        onLoad={(ref) => (autoRef.current = ref)}
        onPlaceChanged={handlePlace}
        options={{
          types: ["hospital"], // 🔥 restrict to hospitals
          componentRestrictions: { country: "in" }, // optional
        }}
      >
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSelected(false);
            setError("");
          }}
          placeholder="Search hospital (must select from dropdown)"
          className={`w-full p-3 border rounded transition ${
            selected
              ? "border-green-500"
              : error
                ? "border-red-500"
                : "border-gray-300"
          }`}
        />
      </Autocomplete>

      {/* ❌ Error message */}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      {/* ⚠️ Not selected properly */}
      {!selected && value && !error && (
        <p className="text-yellow-600 text-sm mt-1">
          ⚠️ Please select from suggestions
        </p>
      )}

      {/* ✅ Success */}
      {selected && (
        <p className="text-green-600 text-sm mt-1">✔ Hospital selected</p>
      )}
    </div>
  );
}
