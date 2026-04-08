import { useJsApiLoader } from "@react-google-maps/api";
import { useMemo } from "react";

export default function MapProvider({ children }) {
  // ✅ Stable libraries reference
  const libraries = useMemo(() => ["geometry", "places"], []);

  // ✅ Get API key from .env
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // ❌ ERROR
  if (loadError) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        ❌ Failed to load Google Maps. Check API key & enabled APIs.
      </div>
    );
  }

  // ⚠️ Missing API key check
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        ❌ Google Maps API key is missing in .env
      </div>
    );
  }

  // ⏳ LOADING
  if (!isLoaded) {
    return <div style={{ padding: "20px" }}>⏳ Loading Maps...</div>;
  }

  // ✅ READY
  return children;
}
