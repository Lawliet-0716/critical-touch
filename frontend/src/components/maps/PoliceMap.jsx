import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { memo, useEffect, useMemo, useRef } from "react";

const containerStyle = { width: "100%", height: "500px" };

const toRad = (x) => (x * Math.PI) / 180;
const haversineMeters = (a, b) => {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

function PoliceMap({ policeLoc, ambulanceLoc }) {
  if (!policeLoc) return <p>Loading map...</p>;

  const mapRef = useRef(null);
  const didFitRef = useRef(false);
  const lastFitKeyRef = useRef("");

  const police = useMemo(
    () => ({ lat: Number(policeLoc.lat), lng: Number(policeLoc.lng) }),
    [policeLoc.lat, policeLoc.lng],
  );

  const ambulance = useMemo(() => {
    if (!ambulanceLoc) return null;
    return { lat: Number(ambulanceLoc.lat), lng: Number(ambulanceLoc.lng) };
  }, [ambulanceLoc?.lat, ambulanceLoc?.lng]);

  if (!Number.isFinite(police.lat) || !Number.isFinite(police.lng)) {
    return <p>Invalid police location</p>;
  }

  if (
    ambulance &&
    (!Number.isFinite(ambulance.lat) || !Number.isFinite(ambulance.lng))
  ) {
    return <p>Invalid ambulance location</p>;
  }

  const policeIcon = useMemo(() => {
    if (!window.google?.maps) return undefined;
    return {
      url: "/police2.png",
      scaledSize: new window.google.maps.Size(70, 35),
      anchor: new window.google.maps.Point(35, 17),
    };
  }, [Boolean(window.google?.maps)]);

  const ambulanceIcon = useMemo(() => {
    if (!window.google?.maps) return undefined;
    return {
      url: "/ambulance1.png",
      scaledSize: new window.google.maps.Size(70, 35),
      anchor: new window.google.maps.Point(35, 17),
    };
  }, [Boolean(window.google?.maps)]);

  // Fit bounds once (and only refit if positions diverge a lot)
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    if (!ambulance) return;

    const fitKey = `${police.lat.toFixed(5)},${police.lng.toFixed(
      5,
    )}|${ambulance.lat.toFixed(5)},${ambulance.lng.toFixed(5)}`;

    if (!didFitRef.current) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(police);
      bounds.extend(ambulance);
      mapRef.current.fitBounds(bounds);
      didFitRef.current = true;
      lastFitKeyRef.current = fitKey;
      return;
    }

    // Refitting repeatedly is expensive. Only refit if the two points have
    // drifted enough since last fit.
    if (!lastFitKeyRef.current) {
      lastFitKeyRef.current = fitKey;
      return;
    }

    const [p0, a0] = lastFitKeyRef.current.split("|");
    const [pLat0, pLng0] = p0.split(",").map(Number);
    const [aLat0, aLng0] = a0.split(",").map(Number);

    const policeMoved =
      haversineMeters({ lat: pLat0, lng: pLng0 }, police) >= 150;
    const ambMoved =
      haversineMeters({ lat: aLat0, lng: aLng0 }, ambulance) >= 150;

    if (policeMoved || ambMoved) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(police);
      bounds.extend(ambulance);
      mapRef.current.fitBounds(bounds);
      lastFitKeyRef.current = fitKey;
    }
  }, [police, ambulance]);

  return (
    <GoogleMap
      center={police}
      zoom={15}
      mapContainerStyle={containerStyle}
      options={{
        clickableIcons: false,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
      }}
      onLoad={(map) => (mapRef.current = map)}
    >
      {/* 🚓 Police */}
      <MarkerF position={police} title="Police" icon={policeIcon} zIndex={2} />

      {/* 🚑 Ambulance */}
      {ambulance && (
        <MarkerF
          position={ambulance}
          title="Ambulance"
          icon={ambulanceIcon}
          zIndex={3}
        />
      )}
    </GoogleMap>
  );
}

export default memo(PoliceMap);
