import { GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
import { useRef, useState } from "react";

export default function PreBookingMap({ onSelect }) {
  const [position, setPosition] = useState(null);
  const autoRef = useRef(null);

  // 🔎 HANDLE SEARCH SELECTION
  const handlePlace = () => {
    const place = autoRef.current?.getPlace();

    if (!place || !place.geometry) return;

    const loc = {
      address: place.formatted_address,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };

    setPosition(loc);
    onSelect(loc);
  };

  // 📍 HANDLE MAP CLICK (PIN)
  const handleMapClick = (e) => {
    const loc = {
      address: "Selected on map",
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };

    setPosition(loc);
    onSelect(loc);
  };

  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2">📍 Pickup Location</h3>

      {/* 🔎 SEARCH INPUT */}
      <Autocomplete
        onLoad={(ref) => (autoRef.current = ref)}
        onPlaceChanged={handlePlace}
      >
        <input
          type="text"
          placeholder="Search pickup location"
          className="w-full p-3 border rounded mb-2"
        />
      </Autocomplete>

      {/* 🗺️ MAP */}
      <GoogleMap
        mapContainerStyle={{ height: "300px", width: "100%" }}
        center={position || { lat: 12.9716, lng: 77.5946 }} // Bangalore default
        zoom={14}
        onClick={handleMapClick}
      >
        {/* 📍 Marker */}
        {position && <Marker position={position} />}
      </GoogleMap>

      {/* ✅ SELECTED LOCATION */}
      {position && (
        <p className="text-green-600 text-sm mt-2">
          ✔ Selected: {position.address}
        </p>
      )}
    </div>
  );
}
