import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { useEffect, useRef, useState } from "react";

export default function PatientMap({
  patientLocation,
  driverLocation,
  height = "400px",
  onInfo,
}) {
  const mapRef = useRef(null);

  const [smoothLoc, setSmoothLoc] = useState(driverLocation);
  const [directions, setDirections] = useState(null);
  const [info, setInfo] = useState(null);
  const [isNear, setIsNear] = useState(false); // 🔥 NEW

  // 🔥 SMOOTH DRIVER MOVEMENT
  useEffect(() => {
    if (!driverLocation) return;

    if (!smoothLoc) {
      setSmoothLoc(driverLocation);
      return;
    }

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
          const nextInfo = {
            distance: leg.distance.text,
            duration: leg.duration.text,
          };
          setInfo(nextInfo);
          if (typeof onInfo === "function") onInfo(nextInfo);

          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(smoothLoc);
          bounds.extend(patientLocation);
          mapRef.current.fitBounds(bounds);
        }
      },
    );
  }, [smoothLoc, patientLocation, onInfo]);

  // 🔥 500m DETECTION
  useEffect(() => {
    if (!window.google || !driverLocation || !patientLocation) return;

    const dist = window.google.maps.geometry.spherical.computeDistanceBetween(
      new window.google.maps.LatLng(driverLocation.lat, driverLocation.lng),
      new window.google.maps.LatLng(patientLocation.lat, patientLocation.lng),
    );

    if (dist < 500) {
      setIsNear(true);
    }
  }, [driverLocation]);

  return (
    <div style={{ position: "relative" }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height }}
        center={patientLocation}
        zoom={14}
        onLoad={(map) => (mapRef.current = map)}
      >
        {/* 🧑 PATIENT */}
        <Marker position={patientLocation} />

        {/* 🚑 DRIVER */}
        {smoothLoc && (
          <Marker
            position={smoothLoc}
            icon={{
              url: "/ambulance1.png",
              scaledSize: new window.google.maps.Size(70, 35),
              anchor: new window.google.maps.Point(35, 17), // 🔥 CENTER FIX
            }}
          />
        )}

        {/* 🛣️ ROUTE */}
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
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          🚑 {info.distance} • ⏱ {info.duration}
        </div>
      )}
    </div>
  );
}
