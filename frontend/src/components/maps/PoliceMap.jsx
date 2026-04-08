import { GoogleMap, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "500px",
};

export default function PoliceMap({ policeLoc, ambulanceLoc }) {
  if (!policeLoc) return <p>Loading map...</p>;

  return (
    <GoogleMap center={policeLoc} zoom={15} mapContainerStyle={containerStyle}>
      {/* 🚓 Police */}
      <Marker position={policeLoc} label="🚓" />

      {/* 🚑 Ambulance */}
      {ambulanceLoc && <Marker position={ambulanceLoc} label="🚑" />}
    </GoogleMap>
  );
}
