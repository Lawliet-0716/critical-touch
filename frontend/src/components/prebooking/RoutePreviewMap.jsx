import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { useEffect, useState } from "react";

export default function RoutePreviewMap({ pickup, hospital }) {
  const [directions, setDirections] = useState(null);

  useEffect(() => {
    if (!pickup || !hospital) return;

    const service = new window.google.maps.DirectionsService();

    service.route(
      {
        origin: pickup,
        destination: {
          lat: hospital.lat, // ✅ FIXED
          lng: hospital.lng, // ✅ FIXED
        },
        travelMode: "DRIVING",
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
        }
      },
    );
  }, [pickup, hospital]);

  return (
    <GoogleMap
      mapContainerStyle={{ height: "300px", width: "100%" }}
      center={pickup}
      zoom={12}
    >
      {/* 📍 Pickup */}
      <Marker position={pickup} />

      {/* 🏥 Hospital */}
      <Marker
        position={{
          lat: hospital.lat, // ✅ FIXED
          lng: hospital.lng, // ✅ FIXED
        }}
        icon="/hospital.png"
      />

      {/* 🗺️ Route */}
      {directions && <DirectionsRenderer directions={directions} />}
    </GoogleMap>
  );
}
