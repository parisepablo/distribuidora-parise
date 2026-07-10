"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { LatLngExpression, Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Check } from "lucide-react";

const markerIcon = new Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapCenter({ center }: { center: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 16);
  }, [center, map]);
  return null;
}

type ResultadoNominatim = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
};

export function MapPicker({
  initialDireccion,
  initialLat,
  initialLng,
  onConfirm,
  onCancel,
}: {
  initialDireccion?: string;
  initialLat?: number;
  initialLng?: number;
  onConfirm: (data: {
    direccion: string;
    lat: number;
    lng: number;
  }) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState(initialDireccion ?? "");
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoNominatim[]>([]);
  const [seleccionado, setSeleccionado] = useState<ResultadoNominatim | null>(
    null
  );

  const centroInicial: LatLngExpression =
    initialLat != null && initialLng != null
      ? [initialLat, initialLng]
      : [-34.6, -58.38];

  async function buscar() {
    if (!query.trim()) return;
    setBuscando(true);
    setResultados([]);
    setSeleccionado(null);

    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", query);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "5");
      url.searchParams.set("countrycodes", "ar");
      url.searchParams.set("addressdetails", "1");

      const res = await fetch(url.toString(), {
        headers: { "User-Agent": "DistribuidoraParise/1.0" },
      });
      const data = (await res.json()) as ResultadoNominatim[];
      setResultados(data);
      if (data.length > 0) {
        setSeleccionado(data[0]);
      }
    } catch {
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }

  const centroActual: LatLngExpression = seleccionado
    ? [parseFloat(seleccionado.lat), parseFloat(seleccionado.lon)]
    : centroInicial;

  function handleConfirm() {
    if (!seleccionado) return;
    onConfirm({
      direccion: seleccionado.display_name,
      lat: parseFloat(seleccionado.lat),
      lng: parseFloat(seleccionado.lon),
    });
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="space-y-2">
        <Label className="text-base">Buscar dirección</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Ej: Av. Corrientes 1234, CABA"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
            className="h-14 flex-1 text-base"
          />
          <Button
            type="button"
            onClick={buscar}
            disabled={buscando || !query.trim()}
            className="h-14 px-4"
          >
            <Search className="size-5" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Escribí la dirección con ciudad/provincia para encontrar la correcta.
        </p>
      </div>

      {resultados.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Resultados
          </p>
          <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
            {resultados.map((r) => {
              const localidad =
                r.address?.city ?? r.address?.town ?? r.address?.village;
              const provincia = r.address?.state;
              const isSelected = seleccionado?.place_id === r.place_id;

              return (
                <button
                  key={r.place_id}
                  type="button"
                  onClick={() => setSeleccionado(r)}
                  className={`w-full rounded-xl border p-4 text-left text-sm transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card hover:bg-secondary/50"
                  }`}
                >
                  <span className="block font-medium">{r.display_name}</span>
                  {(localidad || provincia) && (
                    <span className="block text-xs text-muted-foreground">
                      {localidad}
                      {localidad && provincia ? ", " : ""}
                      {provincia}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-border">
        <MapContainer
          center={centroActual}
          zoom={16}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenter center={centroActual} />
          {seleccionado && (
            <Marker
              position={[
                parseFloat(seleccionado.lat),
                parseFloat(seleccionado.lon),
              ]}
              icon={markerIcon}
            />
          )}
        </MapContainer>

        {!seleccionado && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 p-4 text-center text-muted-foreground backdrop-blur-sm">
            <MapPin className="size-10" />
            <p className="text-base">Buscá una dirección para ver el mapa</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <Button
          type="button"
          disabled={!seleccionado}
          onClick={handleConfirm}
          className="h-14 w-full gap-2 text-lg"
        >
          <Check className="size-5" />
          Confirmar ubicación
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-12 w-full text-base"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
