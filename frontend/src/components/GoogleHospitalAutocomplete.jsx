import { useRef, useEffect } from "react";

export default function GoogleHospitalAutocomplete({ onSelect }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // =======================
  // 🔥 INIT ONLY ONCE
  // =======================
  useEffect(() => {
    if (!window.google || !inputRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["hospital"], // 🔥 restrict to hospitals
        componentRestrictions: { country: "in" }, // 🇮🇳 India (change if needed)
      },
    );

    const listener = autocompleteRef.current.addListener(
      "place_changed",
      () => {
        const place = autocompleteRef.current.getPlace();

        if (!place.geometry) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        const hospitalName = place.name;
        const address = place.formatted_address;

        onSelect({
          hospitalName,
          address,
          location: `${lat},${lng}`, // ✅ backend format
        });
      },
    );

    // =======================
    // 🧹 CLEANUP
    // =======================
    return () => {
      if (listener) listener.remove();
    };
  }, [onSelect]);

  return (
    <input
      ref={inputRef}
      placeholder="Search hospital..."
      className="w-full border p-3 rounded-lg"
    />
  );
}
