import { GoogleMap, MarkerF } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "500px",
};

export default function PoliceMap({ policeLoc, ambulanceLoc }) {
  if (!policeLoc) return <p>Loading map...</p>;

  const police = {
    lat: Number(policeLoc.lat),
    lng: Number(policeLoc.lng),
  };

  const ambulance = ambulanceLoc
    ? { lat: Number(ambulanceLoc.lat), lng: Number(ambulanceLoc.lng) }
    : null;

  if (!Number.isFinite(police.lat) || !Number.isFinite(police.lng)) {
    return <p>Invalid police location</p>;
  }

  if (
    ambulance &&
    (!Number.isFinite(ambulance.lat) || !Number.isFinite(ambulance.lng))
  ) {
    return <p>Invalid ambulance location</p>;
  }

  return (
    <GoogleMap center={police} zoom={15} mapContainerStyle={containerStyle}>
      {/* 🚓 Police */}
      <MarkerF
        position={police}
        title="Police"
        label="P"
        icon={{
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        }}
        zIndex={2}
      />

      {/* 🚑 Ambulance */}
      {ambulance && (
        <MarkerF
          position={ambulance}
          title="Ambulance"
          label="A"
          icon={{
            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
          }}
          zIndex={3}
        />
      )}
    </GoogleMap>
  );
}
