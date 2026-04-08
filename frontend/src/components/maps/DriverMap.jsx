import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { useEffect, useRef, useState } from "react";

const containerStyle = {
  width: "100%",
  height: "400px",
};

export default function DriverMap({ driverLocation, patientLocation }) {
  const mapRef = useRef(null);

  const [smoothLoc, setSmoothLoc] = useState(driverLocation);
  const [directions, setDirections] = useState(null);
  const [info, setInfo] = useState(null);

  // 🔥 SMOOTH MOVEMENT + HEADING
  useEffect(() => {
    if (!driverLocation || !smoothLoc) return;

    const steps = 20;
    let i = 0;

    const latDiff = driverLocation.lat - smoothLoc.lat;
    const lngDiff = driverLocation.lng - smoothLoc.lng;

    const interval = setInterval(() => {
      i++;

      setSmoothLoc((prev) => ({
        lat: prev.lat + latDiff / steps,
        lng: prev.lng + lngDiff / steps,
      }));

      if (i >= steps) clearInterval(interval);
    }, 50);

    return () => clearInterval(interval);
  }, [driverLocation]);

  // 🔥 ROUTE + ETA
  useEffect(() => {
    if (!window.google || !smoothLoc || !patientLocation) return;

    const service = new window.google.maps.DirectionsService();

    service.route(
      {
        origin: smoothLoc,
        destination: patientLocation,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);

          const leg = result.routes[0].legs[0];
          setInfo({
            distance: leg.distance.text,
            duration: leg.duration.text,
          });

          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(smoothLoc);
          bounds.extend(patientLocation);
          mapRef.current.fitBounds(bounds);
        }
      },
    );
  }, [smoothLoc, patientLocation]);

  return (
    <div style={{ position: "relative" }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={smoothLoc}
        zoom={14}
        onLoad={(map) => (mapRef.current = map)}
      >
        <Marker
          position={smoothLoc}
          icon={{
            url: "/ambulance1.png",
            scaledSize: new window.google.maps.Size(70, 35),
            anchor: new window.google.maps.Point(22, 22),
          }}
        />

        {patientLocation && <Marker position={patientLocation} />}

        {directions && (
          <DirectionsRenderer
            options={{
              directions,
              suppressMarkers: true,
            }}
          />
        )}
      </GoogleMap>

      {/* 🚀 ETA BOX */}
      {info && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: "white",
            padding: "10px",
            borderRadius: "10px",
            boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
          }}
        >
          🚑 {info.distance} • ⏱ {info.duration}
        </div>
      )}
    </div>
  );
}
