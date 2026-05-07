"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Search, Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  LIMA_BOUNDS,
  NOMINATIM_BASE_URL,
  OSM_TILE_URL,
  OSM_ATTRIBUTION,
} from "@/lib/constants";

const LIMA_CENTER: [number, number] = [-12.05, -77.05];
const NOMINATIM_USER_AGENT = "UTECCarpool/1.0 (lzm.kalos@gmail.com)";

function createPin() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;
      background:#00BFFF;
      border:3px solid white;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 3px 14px rgba(0,191,255,0.45);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface MapClickHandlerProps {
  onClick: (lat: number, lng: number) => void;
}

function MapClickHandler({ onClick }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface Props {
  value: { lat: number; lng: number; address: string } | null;
  onChange: (value: { lat: number; lng: number; address: string }) => void;
}

export default function MapPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [reversing, setReversing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pin = useRef(createPin());

  const position: [number, number] | null = value
    ? [value.lat, value.lng]
    : null;

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setReversing(true);
      try {
        const res = await fetch(
          `${NOMINATIM_BASE_URL}/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { "User-Agent": NOMINATIM_USER_AGENT } }
        );
        const data = await res.json();
        onChange({ lat, lng, address: data.display_name ?? `${lat}, ${lng}` });
      } catch {
        onChange({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
      } finally {
        setReversing(false);
      }
    },
    [onChange]
  );

  function handleMapClick(lat: number, lng: number) {
    reverseGeocode(lat, lng);
  }

  function handleDragEnd() {
    const marker = markerRef.current;
    if (!marker) return;
    const { lat, lng } = marker.getLatLng();
    reverseGeocode(lat, lng);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const url = new URL(`${NOMINATIM_BASE_URL}/search`);
        url.searchParams.set("q", query);
        url.searchParams.set("format", "json");
        url.searchParams.set("limit", "5");
        url.searchParams.set("countrycodes", "pe");
        url.searchParams.set(
          "viewbox",
          `${LIMA_BOUNDS.southWest.lng},${LIMA_BOUNDS.northEast.lat},${LIMA_BOUNDS.northEast.lng},${LIMA_BOUNDS.southWest.lat}`
        );
        url.searchParams.set("bounded", "1");
        const res = await fetch(url.toString(), {
          headers: { "User-Agent": NOMINATIM_USER_AGENT },
        });
        setResults(await res.json());
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  }, [query]);

  function selectResult(r: NominatimResult) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    onChange({ lat, lng, address: r.display_name });
    setQuery("");
    setResults([]);
    mapRef.current?.flyTo([lat, lng], 16);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search bar */}
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {searching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca tu dirección en Lima…"
          className="h-10 rounded-xl border-border pl-9 text-sm"
        />

        {/* Dropdown */}
        {results.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-[9999] mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
            {results.map((r) => (
              <li key={r.place_id}>
                <button
                  type="button"
                  onClick={() => selectResult(r)}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-xs hover:bg-surface"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="line-clamp-2 text-dark">
                    {r.display_name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div className="relative overflow-hidden rounded-xl border border-border">
        <MapContainer
          center={position ?? LIMA_CENTER}
          zoom={position ? 16 : 12}
          minZoom={10}
          maxZoom={18}
          style={{ height: "320px", width: "100%" }}
          maxBounds={[
            [LIMA_BOUNDS.southWest.lat, LIMA_BOUNDS.southWest.lng],
            [LIMA_BOUNDS.northEast.lat, LIMA_BOUNDS.northEast.lng],
          ]}
          maxBoundsViscosity={0.9}
          ref={mapRef}
        >
          <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
          <MapClickHandler onClick={handleMapClick} />
          {position && (
            <Marker
              draggable
              position={position}
              icon={pin.current}
              ref={markerRef}
              eventHandlers={{ dragend: handleDragEnd }}
            />
          )}
        </MapContainer>

        {/* Overlay hint when no position */}
        {!position && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl bg-white/90 px-4 py-2 text-xs font-medium text-dark shadow-sm backdrop-blur-sm">
              Haz clic en el mapa o busca tu dirección
            </div>
          </div>
        )}

        {reversing && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs shadow-sm backdrop-blur-sm">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              Obteniendo dirección…
            </div>
          </div>
        )}
      </div>

      {/* Selected address */}
      {value?.address && (
        <div className="flex items-start gap-2 rounded-xl bg-surface px-3 py-2.5">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="text-xs text-dark">{value.address}</p>
        </div>
      )}
    </div>
  );
}
