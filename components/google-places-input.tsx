"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

let scriptLoaded = false;
let scriptLoading = false;
const callbacks: (() => void)[] = [];

function loadGoogleMapsScript(apiKey: string) {
  if (scriptLoaded) return;
  if (scriptLoading) return;
  scriptLoading = true;

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  script.onload = () => {
    scriptLoaded = true;
    scriptLoading = false;
    callbacks.forEach((cb) => cb());
    callbacks.length = 0;
  };
  script.onerror = () => {
    scriptLoading = false;
  };
  document.body.appendChild(script);
}

export function GooglePlacesInput({
  value,
  onChange,
  onPlaceSelected,
  label,
  placeholder,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: {
    direccion: string;
    lat: number;
    lng: number;
  }) => void;
  label: string;
  placeholder?: string;
  id?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [ready, setReady] = useState(scriptLoaded);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if (scriptLoaded) {
      setReady(true);
      return;
    }

    callbacks.push(() => setReady(true));
    loadGoogleMapsScript(apiKey);

    return () => {
      const index = callbacks.indexOf(() => setReady(true));
      if (index >= 0) callbacks.splice(index, 1);
    };
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current) return;
    if (autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "ar" },
      fields: ["formatted_address", "geometry"],
      types: ["address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const direccion = place.formatted_address ?? "";
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();

      onChange(direccion);
      if (lat != null && lng != null) {
        onPlaceSelected({ direccion, lat, lng });
      }
    });

    autocompleteRef.current = autocomplete;
  }, [ready, onChange, onPlaceSelected]);

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id} className="text-base">{label}</Label>}
      <Input
        ref={inputRef}
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 text-base"
      />
      {!ready && (
        <p className="text-sm text-muted-foreground">
          Cargando sugerencias de direcciones…
        </p>
      )}
    </div>
  );
}
