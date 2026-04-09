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
        {position && (
          <Marker
            position={position}
            icon={{
              url: "data:image/svg+xml;charset=UTF-8,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' fill='%23dc2626'/%3E%3C/svg%3E",
              scaledSize: new window.google.maps.Size(32, 32),
              anchor: new window.google.maps.Point(16, 32),
            }}
          />
        )}
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
