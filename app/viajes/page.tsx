"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Car,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { UserRole, RequestStatus } from "@/lib/supabase/types";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
};

const STATUS_COLOR: Record<RequestStatus, string> = {
  pending: "bg-secondary/20 text-[#a87e00]",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  cancelled: "bg-surface text-muted-foreground",
};

interface DriverTrip {
  id: string;
  available_seats: number;
  estimated_price_soles: number;
  status: string;
  created_at: string;
  schedule: { day_of_week: number; departure_time: string; direction: string } | null;
  requests: Array<{
    id: string;
    status: RequestStatus;
    passenger_id: string;
    passenger: {
      full_name: string;
      career: string;
      cycle: number;
      avatar_url: string | null;
    } | null;
  }>;
}

interface PassengerRequest {
  id: string;
  status: RequestStatus;
  created_at: string;
  trip: {
    id: string;
    available_seats: number;
    estimated_price_soles: number;
    status: string;
    schedule: { day_of_week: number; departure_time: string; direction: string } | null;
    driver: {
      full_name: string;
      career: string;
      cycle: number;
      avatar_url: string | null;
    } | null;
  } | null;
}

type Tab = "driver" | "passenger";

export default function ViajesPage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("driver");

  const [driverTrips, setDriverTrips] = useState<DriverTrip[]>([]);
  const [passengerRequests, setPassengerRequests] = useState<PassengerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from("profiles") as any)
        .select("role")
        .eq("id", user.id)
        .single();

      const userRole: UserRole = profile?.role ?? "passenger";
      setRole(userRole);
      setActiveTab(userRole === "passenger" ? "passenger" : "driver");

      const isDriver = userRole === "driver" || userRole === "both";
      const isPassenger = userRole === "passenger" || userRole === "both";

      const tasks: Promise<void>[] = [];

      if (isDriver) {
        tasks.push(
          (async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await (supabase.from("trips") as any)
              .select(
                `id, available_seats, estimated_price_soles, status, created_at,
                schedule:schedules(day_of_week, departure_time, direction),
                requests:trip_requests(
                  id, status, passenger_id,
                  passenger:profiles!trip_requests_passenger_id_fkey(full_name, career, cycle, avatar_url)
                )`
              )
              .eq("driver_id", user.id)
              .in("status", ["open", "full"])
              .order("created_at", { ascending: false });

            if (data) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const mapped: DriverTrip[] = (data as any[]).map((t: any) => ({
                ...t,
                schedule: Array.isArray(t.schedule) ? t.schedule[0] : t.schedule,
                requests: (t.requests ?? []).map((r: any) => ({
                  ...r,
                  passenger: Array.isArray(r.passenger) ? r.passenger[0] : r.passenger,
                })),
              }));
              setDriverTrips(mapped);
            }
          })()
        );
      }

      if (isPassenger) {
        tasks.push(
          (async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await (supabase.from("trip_requests") as any)
              .select(
                `id, status, created_at,
                trip:trips(
                  id, available_seats, estimated_price_soles, status,
                  schedule:schedules(day_of_week, departure_time, direction),
                  driver:profiles!trips_driver_id_fkey(full_name, career, cycle, avatar_url)
                )`
              )
              .eq("passenger_id", user.id)
              .order("created_at", { ascending: false });

            if (data) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const mapped: PassengerRequest[] = (data as any[]).map((r: any) => ({
                ...r,
                trip: r.trip
                  ? {
                      ...r.trip,
                      schedule: Array.isArray(r.trip.schedule)
                        ? r.trip.schedule[0]
                        : r.trip.schedule,
                      driver: Array.isArray(r.trip.driver)
                        ? r.trip.driver[0]
                        : r.trip.driver,
                    }
                  : null,
              }));
              setPassengerRequests(mapped);
            }
          })()
        );
      }

      await Promise.all(tasks);
      setLoading(false);
    }

    init();
  }, []);

  async function handleRequestAction(requestId: string, newStatus: "accepted" | "rejected") {
    setActionLoading(requestId);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("trip_requests") as any)
      .update({ status: newStatus })
      .eq("id", requestId);

    if (error) {
      showToast("Error al actualizar la solicitud.", false);
    } else {
      const label = newStatus === "accepted" ? "Solicitud aceptada." : "Solicitud rechazada.";
      showToast(label, newStatus === "accepted");
      setDriverTrips((prev) =>
        prev.map((trip) => ({
          ...trip,
          requests: trip.requests.map((r) =>
            r.id === requestId ? { ...r, status: newStatus } : r
          ),
        }))
      );
    }
    setActionLoading(null);
  }

  async function handleCancelRequest(requestId: string) {
    setActionLoading(requestId);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("trip_requests") as any)
      .update({ status: "cancelled" })
      .eq("id", requestId);

    if (error) {
      showToast("Error al cancelar la solicitud.", false);
    } else {
      showToast("Solicitud cancelada.", true);
      setPassengerRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "cancelled" } : r))
      );
    }
    setActionLoading(null);
  }

  const isDriver = role === "driver" || role === "both";
  const isPassenger = role === "passenger" || role === "both";
  const isBoth = role === "both";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-heading text-xl font-bold text-dark">Mis viajes</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Gestioná tus viajes y solicitudes.
        </p>
      </div>

      {/* Tabs — solo si role === "both" */}
      {isBoth && (
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("driver")}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
              activeTab === "driver"
                ? "bg-[#0f1c2e] text-white"
                : "bg-white border border-border text-muted-foreground hover:border-[#0f1c2e]/40"
            )}
          >
            Como conductor
          </button>
          <button
            onClick={() => setActiveTab("passenger")}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
              activeTab === "passenger"
                ? "bg-primary text-white"
                : "bg-white border border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            Como pasajero
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Driver section ── */}
          {isDriver && (!isBoth || activeTab === "driver") && (
            <div className="space-y-4">
              {driverTrips.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
                    <Car className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-semibold text-dark">Sin viajes activos</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Publicá un viaje para recibir solicitudes.
                  </p>
                  <Link
                    href="/publicar"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "#0f1c2e" }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Publicar viaje
                  </Link>
                </div>
              ) : (
                driverTrips.map((trip) => {
                  const isToUtec = trip.schedule?.direction === "to_utec";
                  const pendingRequests = trip.requests.filter((r) => r.status === "pending");
                  const otherRequests = trip.requests.filter((r) => r.status !== "pending");
                  return (
                    <div key={trip.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                      {/* Trip header */}
                      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
                        <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <span className="font-semibold text-dark">
                            {DAYS[trip.schedule?.day_of_week ?? 0]}{" "}
                            {trip.schedule?.departure_time?.slice(0, 5)}
                          </span>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            isToUtec
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary/20 text-[#a87e00]"
                          }`}
                        >
                          {isToUtec ? "→ UTEC" : "← Casa"}
                        </span>
                        <div className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {trip.available_seats} asientos
                          </span>
                          <span className="font-bold text-dark">
                            S/ {trip.estimated_price_soles}
                          </span>
                        </div>
                      </div>

                      {/* Requests */}
                      {trip.requests.length === 0 ? (
                        <div className="px-5 py-6 text-center text-xs text-muted-foreground">
                          Sin solicitudes aún
                        </div>
                      ) : (
                        <div className="divide-y divide-border/50">
                          {[...pendingRequests, ...otherRequests].map((req) => {
                            const pi = req.passenger?.full_name?.[0]?.toUpperCase() ?? "P";
                            const isPending = req.status === "pending";
                            return (
                              <div key={req.id} className="flex items-center gap-3 px-5 py-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                                  {req.passenger?.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={req.passenger.avatar_url}
                                      alt={req.passenger.full_name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-bold text-primary">{pi}</span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-dark">
                                    {req.passenger?.full_name ?? "—"}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {req.passenger?.career} · Ciclo {req.passenger?.cycle}
                                  </p>
                                </div>
                                {isPending ? (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleRequestAction(req.id, "accepted")}
                                      disabled={actionLoading === req.id}
                                      className="flex items-center gap-1 rounded-xl bg-green-500 px-3 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                                    >
                                      <CheckCircle className="h-3.5 w-3.5" />
                                      Aceptar
                                    </button>
                                    <button
                                      onClick={() => handleRequestAction(req.id, "rejected")}
                                      disabled={actionLoading === req.id}
                                      className="flex items-center gap-1 rounded-xl bg-red-100 px-3 py-1.5 text-[11px] font-semibold text-red-600 transition-opacity hover:opacity-90 disabled:opacity-50"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                      Rechazar
                                    </button>
                                  </div>
                                ) : (
                                  <span
                                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLOR[req.status]}`}
                                  >
                                    {STATUS_LABEL[req.status]}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Passenger section ── */}
          {isPassenger && (!isBoth || activeTab === "passenger") && (
            <div className="space-y-4">
              {passengerRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
                    <Search className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-semibold text-dark">Sin solicitudes aún</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Busca un viaje y envía tu solicitud.
                  </p>
                  <Link
                    href="/buscar"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    <Search className="h-3.5 w-3.5" />
                    Buscar viaje
                  </Link>
                </div>
              ) : (
                passengerRequests.map((req) => {
                  const trip = req.trip;
                  const isToUtec = trip?.schedule?.direction === "to_utec";
                  const driverInitial = trip?.driver?.full_name?.[0]?.toUpperCase() ?? "C";
                  const isPending = req.status === "pending";
                  const isAccepted = req.status === "accepted";

                  return (
                    <div key={req.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                      {/* Trip info header */}
                      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
                        <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-xs">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <span className="font-semibold text-dark">
                            {DAYS[trip?.schedule?.day_of_week ?? 0]}{" "}
                            {trip?.schedule?.departure_time?.slice(0, 5)}
                          </span>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            isToUtec
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary/20 text-[#a87e00]"
                          }`}
                        >
                          {isToUtec ? "→ UTEC" : "← Casa"}
                        </span>
                        <span className="ml-auto font-bold text-sm text-dark">
                          S/ {trip?.estimated_price_soles}
                        </span>
                      </div>

                      {/* Body */}
                      <div className="px-5 py-4 space-y-3">
                        {/* Status */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Estado</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLOR[req.status]}`}>
                            {STATUS_LABEL[req.status]}
                          </span>
                        </div>

                        {/* Driver info — siempre visible, más detalle si aceptado */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                            {trip?.driver?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={trip.driver.avatar_url}
                                alt={trip.driver.full_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-primary">{driverInitial}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-dark">
                              {trip?.driver?.full_name ?? "—"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {trip?.driver?.career} · Ciclo {trip?.driver?.cycle}
                            </p>
                          </div>
                          {isAccepted && (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </span>
                          )}
                        </div>

                        {/* Cancel button for pending */}
                        {isPending && (
                          <button
                            onClick={() => handleCancelRequest(req.id)}
                            disabled={actionLoading === req.id}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancelar solicitud
                          </button>
                        )}

                        {isAccepted && (
                          <Link
                            href="/buscar"
                            className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-xs font-medium text-dark"
                          >
                            <span>Ver detalles del viaje</span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-24 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg lg:bottom-6",
            toast.ok ? "bg-green-500" : "bg-red-500"
          )}
        >
          {!toast.ok && <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
