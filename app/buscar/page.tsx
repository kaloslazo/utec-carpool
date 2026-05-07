"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Search, MapPin, Clock, Users, Star, ChevronRight,
  AlertCircle, CheckCircle, ExternalLink, Navigation2, ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { TripDirection } from "@/lib/supabase/types";
import { Input } from "@/components/ui/input";

const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false });

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type Filter = "all" | TripDirection;

interface TripCard {
  id: string;
  available_seats: number;
  estimated_price_soles: number;
  allows_detour: boolean;
  status: string;
  schedule: {
    day_of_week: number;
    departure_time: string;
    direction: TripDirection;
  };
  driver: {
    id: string;
    full_name: string;
    career: string;
    cycle: number;
    avatar_url: string | null;
  };
}

interface Dropoff {
  lat: number;
  lng: number;
  address: string;
}

function TripSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="animate-pulse">
        <div className="bg-surface/40 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 rounded-full bg-border/60" />
              <div className="h-5 w-24 rounded-full bg-border/60" />
            </div>
            <div className="h-6 w-14 rounded-full bg-border/60" />
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 rounded-full bg-border/50" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 rounded-lg bg-border/50" />
              <div className="h-3 w-48 rounded-lg bg-border/40" />
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => <div key={i} className="h-3 w-3 rounded bg-border/40" />)}
              </div>
            </div>
          </div>
          <div className="mt-3 h-9 rounded-xl bg-surface/60" />
        </div>
        <div className="border-t border-border/60 px-4 py-2.5">
          <div className="h-9 rounded-xl bg-border/30" />
        </div>
      </div>
    </div>
  );
}

export default function BuscarPage() {
  const [trips, setTrips] = useState<TripCard[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Route expansion state
  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(new Set());
  const [driverLocations, setDriverLocations] = useState<Record<string, { lat: number; lng: number }>>({});
  const [loadingLocations, setLoadingLocations] = useState<Set<string>>(new Set());
  const [dropoffs, setDropoffs] = useState<Record<string, Dropoff>>({});

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    async function fetchTrips() {
      setLoading(true);
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("trips") as any)
        .select(`
          id, available_seats, estimated_price_soles, allows_detour, status,
          schedule:schedules ( day_of_week, departure_time, direction ),
          driver:profiles!trips_driver_id_fkey ( id, full_name, career, cycle, avatar_url )
        `)
        .eq("status", "open")
        .gt("available_seats", 0)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error && data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: TripCard[] = (data as any[]).map((t: any) => ({
          id: t.id,
          available_seats: t.available_seats,
          estimated_price_soles: t.estimated_price_soles,
          allows_detour: t.allows_detour ?? false,
          status: t.status,
          schedule: Array.isArray(t.schedule) ? t.schedule[0] : t.schedule,
          driver: Array.isArray(t.driver) ? t.driver[0] : t.driver,
        })).filter(t => t.schedule && t.driver);
        setTrips(mapped);
      }
      setLoading(false);
    }
    fetchTrips();
  }, [filter]);

  async function fetchDriverLocation(trip: TripCard) {
    if (driverLocations[trip.id] || loadingLocations.has(trip.id)) return;

    setLoadingLocations(prev => new Set(prev).add(trip.id));
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("locations") as any)
      .select("lat, lng")
      .eq("user_id", trip.driver.id)
      .eq("is_home", true)
      .maybeSingle();

    if (data) {
      setDriverLocations(prev => ({ ...prev, [trip.id]: { lat: data.lat, lng: data.lng } }));
    }
    setLoadingLocations(prev => { const s = new Set(prev); s.delete(trip.id); return s; });
  }

  function toggleRouteExpanded(trip: TripCard) {
    setExpandedTrips(prev => {
      const next = new Set(prev);
      if (next.has(trip.id)) {
        next.delete(trip.id);
      } else {
        next.add(trip.id);
        fetchDriverLocation(trip);
      }
      return next;
    });
  }

  const displayed = trips
    .filter(t => filter === "all" || t.schedule?.direction === filter)
    .filter(t =>
      searchQuery.trim() === "" ||
      t.driver?.full_name?.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

  async function handleRequest(trip: TripCard) {
    setRequesting(trip.id);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setRequesting(null); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from("trip_requests") as any)
      .select("id")
      .eq("trip_id", trip.id)
      .eq("passenger_id", user.id)
      .maybeSingle();

    if (existing) {
      showToast("Ya solicitaste este viaje.", false);
      setRequesting(null);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: loc } = await (supabase.from("locations") as any)
      .select("lat, lng, address")
      .eq("user_id", user.id)
      .eq("is_home", true)
      .maybeSingle();

    const pickup_lat = loc?.lat ?? -12.1219;
    const pickup_lng = loc?.lng ?? -77.0282;
    const pickup_address = loc?.address ?? "UTEC Campus";

    const dropoff = dropoffs[trip.id];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("trip_requests") as any).insert({
      trip_id: trip.id,
      passenger_id: user.id,
      pickup_lat,
      pickup_lng,
      pickup_address,
      dropoff_lat: dropoff?.lat ?? null,
      dropoff_lng: dropoff?.lng ?? null,
      dropoff_address: dropoff?.address ?? null,
      status: "pending",
    });

    if (error) {
      showToast("Error al enviar la solicitud.", false);
    } else {
      showToast("Solicitud enviada. El conductor te confirmará pronto.", true);
    }
    setRequesting(null);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">

      {/* Header */}
      <div>
        <h1 className="font-heading text-xl font-bold text-dark">Buscar viaje</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Encuentra conductores que van hacia o desde UTEC.
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          type="text"
          placeholder="Buscar por nombre del conductor..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-11 shadow-sm"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {(["all", "to_utec", "from_utec"] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
              filter === f
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-muted-foreground border border-border hover:border-primary/40"
            )}
          >
            {f === "all" ? "Todos" : f === "to_utec" ? "→ UTEC" : "← Casa"}
          </button>
        ))}
      </div>

      {/* Trip list */}
      {loading ? (
        <div className="space-y-3">
          <TripSkeleton />
          <TripSkeleton />
          <TripSkeleton />
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
            <Search className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-semibold text-dark">
            {searchQuery ? "Sin resultados para esa búsqueda" : "No hay viajes disponibles"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {searchQuery ? "Prueba con otro nombre." : "Intenta con otro filtro o vuelve más tarde."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(trip => {
            const initial = trip.driver?.full_name?.[0]?.toUpperCase() ?? "U";
            const isToUtec = trip.schedule?.direction === "to_utec";
            const isExpanded = expandedTrips.has(trip.id);
            const driverLoc = driverLocations[trip.id];
            const isLoadingLoc = loadingLocations.has(trip.id);
            const dropoff = dropoffs[trip.id];

            return (
              <div
                key={trip.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Card header */}
                <div className="flex items-center justify-between bg-surface/30 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                      isToUtec ? "bg-primary/15 text-primary" : "bg-[#FBBC06]/20 text-amber-700"
                    )}>
                      {isToUtec ? "→ UTEC" : "← Casa"}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-medium text-dark">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {DAYS[trip.schedule?.day_of_week]} · {trip.schedule?.departure_time?.slice(0, 5)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {trip.allows_detour && (
                      <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        <Navigation2 className="h-2.5 w-2.5" />
                        Desvíos
                      </span>
                    )}
                    <span className="text-sm font-extrabold text-dark">
                      S/ {trip.estimated_price_soles}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 ring-2 ring-primary/20">
                      {trip.driver?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={trip.driver.avatar_url} alt={trip.driver.full_name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-heading text-sm font-bold text-primary">{initial}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-dark">{trip.driver?.full_name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {trip.driver?.career} · Ciclo {trip.driver?.cycle}
                      </p>
                      <div className="mt-1.5 flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={cn("h-3 w-3", s <= 4 ? "fill-[#FBBC06] text-[#FBBC06]" : "text-border")} />
                        ))}
                        <span className="ml-1 text-[11px] text-muted-foreground">4.0</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-bold text-dark">
                        {trip.available_seats}
                      </span>
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface/50 px-3 py-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate">
                      {isToUtec ? "Desde tu zona → UTEC" : "UTEC → Tu zona"}
                    </span>
                    <span className="ml-auto shrink-0 font-medium">
                      {trip.available_seats} {trip.available_seats === 1 ? "asiento" : "asientos"}
                    </span>
                  </div>

                  {/* Route expansion */}
                  {isExpanded && (
                    <div className="mt-3 space-y-2">
                      {isLoadingLoc || !driverLoc ? (
                        <div className="flex h-36 items-center justify-center rounded-xl bg-surface/50">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            Cargando ruta...
                          </div>
                        </div>
                      ) : (
                        <>
                          <RouteMap
                            driverLat={driverLoc.lat}
                            driverLng={driverLoc.lng}
                            dropoffLat={dropoff?.lat}
                            dropoffLng={dropoff?.lng}
                            allowsDropoff={trip.allows_detour}
                            onDropoffChange={(lat, lng, address) =>
                              setDropoffs(prev => ({ ...prev, [trip.id]: { lat, lng, address } }))
                            }
                            height="200px"
                          />
                          {trip.allows_detour && dropoff && (
                            <div className="flex items-start gap-2 rounded-xl bg-secondary/10 px-3 py-2">
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold text-dark">Punto de bajada</p>
                                <p className="truncate text-[11px] text-muted-foreground">{dropoff.address}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setDropoffs(prev => { const n = {...prev}; delete n[trip.id]; return n; })}
                                className="shrink-0 text-[11px] font-semibold text-red-400 hover:text-red-500"
                              >
                                Quitar
                              </button>
                            </div>
                          )}
                          {trip.allows_detour && !dropoff && (
                            <p className="text-center text-[11px] text-muted-foreground">
                              Toca el mapa para indicar dónde quieres que te dejen
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex gap-2 border-t border-border/60 px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleRouteExpanded(trip)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                      isExpanded
                        ? "border-primary/30 bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                    )}
                  >
                    <Navigation2 className="h-3.5 w-3.5" />
                    Ver ruta
                    <ChevronDown className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-180")} />
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver perfil
                  </button>
                  <button
                    onClick={() => handleRequest(trip)}
                    disabled={requesting === trip.id}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-60"
                  >
                    {requesting === trip.id ? "Enviando..." : (
                      <>
                        Solicitar
                        <ChevronRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-24 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg lg:bottom-6",
            toast.ok ? "bg-green-500" : "bg-red-500"
          )}
        >
          {toast.ok
            ? <CheckCircle className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
