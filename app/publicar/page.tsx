"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Plus, Calendar, Users, DollarSign, CheckCircle, AlertCircle, Navigation2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false });

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface Schedule {
  id: string;
  day_of_week: number;
  departure_time: string;
  direction: "to_utec" | "from_utec";
}

interface PublishedTrip {
  id: string;
  schedule_id: string;
  available_seats: number;
  estimated_price_soles: number;
  status: string;
  allows_detour: boolean;
  created_at: string;
}

export default function PublicarPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [publishedTrips, setPublishedTrips] = useState<PublishedTrip[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [seats, setSeats] = useState(2);
  const [price, setPrice] = useState<string>("5");
  const [allowsDetour, setAllowsDetour] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const fetchedRef = useRef(false);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  async function fetchData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sched } = await (supabase.from("schedules") as any)
      .select("id, day_of_week, departure_time, direction")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("day_of_week")
      .order("departure_time");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: trips } = await (supabase.from("trips") as any)
      .select("id, schedule_id, available_seats, estimated_price_soles, status, allows_detour, created_at")
      .eq("driver_id", user.id)
      .in("status", ["open", "full"])
      .order("created_at", { ascending: false })
      .limit(10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: loc } = await (supabase.from("locations") as any)
      .select("lat, lng")
      .eq("user_id", user.id)
      .eq("is_home", true)
      .maybeSingle();

    setSchedules(sched ?? []);
    setPublishedTrips(trips ?? []);
    if (loc) setDriverLocation({ lat: loc.lat, lng: loc.lng });
    if (sched?.[0] && !selectedScheduleId) setSelectedScheduleId(sched[0].id);
    setLoading(false);
  }

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedScheduleId) return;
    setSubmitting(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 1) {
      showToast("Ingresa un precio válido.", false);
      setSubmitting(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from("trips") as any)
      .select("id")
      .eq("driver_id", user.id)
      .eq("schedule_id", selectedScheduleId)
      .in("status", ["open", "full"])
      .maybeSingle();

    if (existing) {
      showToast("Ya publicaste un viaje para este horario.", false);
      setSubmitting(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("trips") as any).insert({
      driver_id: user.id,
      schedule_id: selectedScheduleId,
      available_seats: seats,
      estimated_price_soles: priceNum,
      allows_detour: allowsDetour,
      status: "open",
    });

    if (error) {
      showToast("Error al publicar el viaje.", false);
    } else {
      showToast("Viaje publicado con éxito.", true);
      await fetchData();
    }
    setSubmitting(false);
  }

  async function handleCancel(tripId: string) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("trips") as any).update({ status: "cancelled" }).eq("id", tripId);
    await fetchData();
    showToast("Viaje cancelado.", true);
  }

  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-heading text-xl font-bold text-dark">Publicar viaje</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Ofrece asientos para compañeros que van hacia UTEC.
        </p>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      ) : schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
            <Calendar className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-semibold text-dark">Sin horarios configurados</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Agrega tus horarios en el perfil para publicar un viaje.
          </p>
        </div>
      ) : (
        <form onSubmit={handlePublish} className="space-y-4">

          {/* Schedule selector */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-border px-5 py-3.5">
              <p className="font-heading text-sm font-bold text-dark">Selecciona un horario</p>
            </div>
            <div className="divide-y divide-border/60">
              {schedules.map(s => {
                const active = s.id === selectedScheduleId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedScheduleId(s.id)}
                    className={cn(
                      "flex w-full items-center gap-4 px-5 py-3 text-left transition-colors",
                      active ? "bg-primary/5" : "hover:bg-surface/50"
                    )}
                  >
                    <div className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      active ? "border-primary bg-primary" : "border-border"
                    )}>
                      {active && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-surface">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-primary">
                        {DAYS[s.day_of_week]}
                      </span>
                      <span className="text-xs font-bold text-dark">
                        {s.departure_time?.slice(0, 5)}
                      </span>
                    </div>
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      s.direction === "to_utec"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary/20 text-secondary-foreground"
                    )}>
                      {s.direction === "to_utec" ? "→ UTEC" : "← Casa"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trip config */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-border px-5 py-3.5">
              <p className="font-heading text-sm font-bold text-dark">Detalles del viaje</p>
            </div>
            <div className="space-y-4 p-5">

              {/* Seats */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-dark">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  Asientos disponibles
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSeats(n)}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all",
                        seats === n
                          ? "bg-primary text-white shadow-sm"
                          : "bg-surface text-muted-foreground hover:bg-primary/10"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-dark">
                  <DollarSign className="h-3.5 w-3.5 text-primary" />
                  Precio por pasajero (S/)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">S/</span>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    step="0.5"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="pl-9 font-semibold"
                  />
                </div>
              </div>

              {/* Allows detour toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setAllowsDetour(prev => !prev)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-all",
                    allowsDetour
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-surface/50 hover:border-primary/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Navigation2 className={cn("h-4 w-4", allowsDetour ? "text-primary" : "text-muted-foreground")} />
                    <div className="text-left">
                      <p className={cn("text-xs font-semibold", allowsDetour ? "text-dark" : "text-muted-foreground")}>
                        Acepto desvíos
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Los pasajeros pueden indicar un punto de bajada
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "relative h-5 w-9 rounded-full transition-colors",
                    allowsDetour ? "bg-primary" : "bg-border"
                  )}>
                    <div className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
                      allowsDetour ? "left-4" : "left-0.5"
                    )} />
                  </div>
                </button>
              </div>
            </div>

            <div className="border-t border-border px-5 py-4">
              <button
                type="submit"
                disabled={submitting || !selectedScheduleId}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {submitting ? "Publicando..." : "Publicar viaje"}
              </button>
            </div>
          </div>

          {/* Route preview */}
          {driverLocation && selectedSchedule && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b border-border px-5 py-3.5">
                <p className="font-heading text-sm font-bold text-dark">Vista previa de ruta</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {selectedSchedule.direction === "to_utec" ? "Tu casa → UTEC Barranco" : "UTEC Barranco → Tu casa"}
                </p>
              </div>
              <div className="p-4">
                <RouteMap
                  driverLat={driverLocation.lat}
                  driverLng={driverLocation.lng}
                  height="220px"
                />
              </div>
            </div>
          )}
        </form>
      )}

      {/* Published trips */}
      {publishedTrips.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-border px-5 py-3.5">
            <p className="font-heading text-sm font-bold text-dark">Mis viajes publicados</p>
          </div>
          <div className="divide-y divide-border/60">
            {publishedTrips.map(trip => {
              const sched = schedules.find(s => s.id === trip.schedule_id);
              return (
                <div key={trip.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-surface">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-primary">
                      {sched ? DAYS[sched.day_of_week] : "—"}
                    </span>
                    <span className="text-xs font-bold text-dark">
                      {sched?.departure_time?.slice(0, 5) ?? "—"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        trip.status === "open" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      )}>
                        {trip.status === "open" ? "Abierto" : "Lleno"}
                      </span>
                      {trip.allows_detour && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          Acepta desvíos
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {trip.available_seats} asiento{trip.available_seats !== 1 ? "s" : ""} · S/ {trip.estimated_price_soles}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancel(trip.id)}
                    className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              );
            })}
          </div>
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
