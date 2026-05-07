"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Loader2 } from "lucide-react";
import { OSM_TILE_URL, OSM_ATTRIBUTION, NOMINATIM_BASE_URL } from "@/lib/constants";

const UTEC_LAT = -12.1219;
const UTEC_LNG = -77.0282;
const NOMINATIM_USER_AGENT = "UTECCarpool/1.0 (lzm.kalos@gmail.com)";

function makeIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;background:${color};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  });
}

function DropoffHandler({ onPlace }: { onPlace: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPlace(e.latlng.lat, e.latlng.lng); } });
  return null;
}

export interface RouteMapProps {
  driverLat: number;
  driverLng: number;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  allowsDropoff?: boolean;
  onDropoffChange?: (lat: number, lng: number, address: string) => void;
  height?: string;
}

export default function RouteMap({
  driverLat,
  driverLng,
  dropoffLat,
  dropoffLng,
  allowsDropoff = false,
  onDropoffChange,
  height = "220px",
}: RouteMapProps) {
  const [route, setRoute] = useState<[number, number][]>([]);
  const [loadingRoute, setLoadingRoute] = useState(true);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);

  const homeIcon = useRef(makeIcon("#00BFFF"));
  const utecIcon = useRef(makeIcon("#0f1c2e"));
  const dropoffIcon = useRef(makeIcon("#FBBC06"));

  const centerLat = (driverLat + UTEC_LAT) / 2;
  const centerLng = (driverLng + UTEC_LNG) / 2;

  useEffect(() => {
    async function fetchRoute() {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${driverLng},${driverLat};${UTEC_LNG},${UTEC_LAT}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        if (data.routes?.[0]) {
          const coords = data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
          );
          setRoute(coords);
        }
      } catch {
        setRoute([[driverLat, driverLng], [UTEC_LAT, UTEC_LNG]]);
      } finally {
        setLoadingRoute(false);
      }
    }
    fetchRoute();
  }, [driverLat, driverLng]);

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `${NOMINATIM_BASE_URL}/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "User-Agent": NOMINATIM_USER_AGENT } }
      );
      const data = await res.json();
      onDropoffChange?.(lat, lng, data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      onDropoffChange?.(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  }

  function handleDropoffDragEnd() {
    const marker = dropoffMarkerRef.current;
    if (!marker) return;
    const { lat, lng } = marker.getLatLng();
    reverseGeocode(lat, lng);
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border" style={{ height }}>
      {loadingRoute && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
        {route.length > 0 && (
          <Polyline positions={route} color="#00BFFF" weight={4} opacity={0.85} />
        )}
        <Marker position={[driverLat, driverLng]} icon={homeIcon.current} />
        <Marker position={[UTEC_LAT, UTEC_LNG]} icon={utecIcon.current} />
        {dropoffLat != null && dropoffLng != null && (
          <Marker
            position={[dropoffLat, dropoffLng]}
            icon={dropoffIcon.current}
            draggable={!!allowsDropoff}
            ref={dropoffMarkerRef}
            eventHandlers={{ dragend: handleDropoffDragEnd }}
          />
        )}
        {allowsDropoff && onDropoffChange && (
          <DropoffHandler onPlace={(lat, lng) => reverseGeocode(lat, lng)} />
        )}
      </MapContainer>
      {allowsDropoff && !dropoffLat && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
          <div className="rounded-full bg-white/90 px-3 py-1 text-xs shadow-sm backdrop-blur-sm text-dark">
            Toca el mapa para indicar tu punto de bajada
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1 rounded-lg bg-white/90 px-2.5 py-2 text-[10px] shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="text-dark">Origen conductor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#0f1c2e]" />
          <span className="text-dark">UTEC</span>
        </div>
        {(dropoffLat != null || allowsDropoff) && (
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
            <span className="text-dark">Tu bajada</span>
          </div>
        )}
      </div>
    </div>
  );
}
