import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { useEffect, useRef, useState } from "react";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

export default function DriverHospitalMap({
  destination,
  driverLocation: externalDriverLocation,
  hospitalLocation: externalHospitalLocation,
  onEta,
}) {
  const mapRef = useRef(null);

  const [driverLocation, setDriverLocation] = useState(null);
  const [hospitalLocation, setHospitalLocation] = useState(null);
  const [directions, setDirections] = useState(null);

  // 📍 DRIVER LOCATION (SAFE)
  useEffect(() => {
    if (externalDriverLocation) {
      setDriverLocation(externalDriverLocation);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setDriverLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [externalDriverLocation]);

  // 🏥 DESTINATION (patient-selected hospital) OR nearest hospital fallback
  useEffect(() => {
    if (externalHospitalLocation) {
      setHospitalLocation(externalHospitalLocation);
      return;
    }

    if (!driverLocation || !mapRef.current || !window.google) return;

    if (
      destination &&
      typeof destination.lat === "number" &&
      typeof destination.lng === "number"
    ) {
      setHospitalLocation({ lat: destination.lat, lng: destination.lng });
      return;
    }

    const service = new window.google.maps.places.PlacesService(mapRef.current);

    service.nearbySearch(
      {
        location: driverLocation,
        rankBy: window.google.maps.places.RankBy.DISTANCE,
        keyword: "hospital",
      },
      (results, status) => {
        if (status !== "OK" || !results.length) return;

        const hospital = results[0];

        const loc = {
          lat: hospital.geometry.location.lat(),
          lng: hospital.geometry.location.lng(),
        };

        setHospitalLocation(loc);
      },
    );
  }, [driverLocation, destination]);

  // 🛣 ROUTE
  useEffect(() => {
    if (!driverLocation || !hospitalLocation || !window.google) return;

    const service = new window.google.maps.DirectionsService();

    service.route(
      {
        origin: driverLocation,
        destination: hospitalLocation,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (res, status) => {
        if (status === "OK") {
          setDirections(res);

          const leg = res?.routes?.[0]?.legs?.[0];
          const mins = leg?.duration?.value
            ? Math.max(1, Math.round(leg.duration.value / 60))
            : null;
          if (typeof onEta === "function") onEta(mins);

          // 🔥 AUTO FIT BOUNDS
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(driverLocation);
          bounds.extend(hospitalLocation);
          mapRef.current.fitBounds(bounds);
        }
      },
    );
  }, [driverLocation, hospitalLocation]);

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={driverLocation || { lat: 12.9716, lng: 77.5946 }}
      zoom={15}
      onLoad={(map) => (mapRef.current = map)}
    >
      {/* 🚑 DRIVER */}
      {driverLocation && (
        <Marker
          position={driverLocation}
          icon={{
            url: "/ambulance1.png",
            scaledSize: new window.google.maps.Size(70, 35),
            anchor: new window.google.maps.Point(35, 17),
          }}
        />
      )}

      {/* 🏥 HOSPITAL */}
      {hospitalLocation && (
        <Marker
          position={hospitalLocation}
          icon={{
            url: "/hospital.png",
            scaledSize: new window.google.maps.Size(60, 60),
          }}
        />
      )}

      {/* 🛣 ROUTE */}
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: "#00E5FF",
              strokeWeight: 5,
            },
          }}
        />
      )}
    </GoogleMap>
  );
}
