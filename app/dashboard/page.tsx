import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Bell, Car, Search, Plus, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAYS_LONG = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const ROLE_LABEL: Record<UserRole, string> = {
  passenger: "Pasajero",
  driver: "Conductor",
  both: "Conductor · Pasajero",
};

const ROLE_COLOR: Record<UserRole, string> = {
  passenger: "bg-primary/10 text-primary",
  driver: "bg-[#0f1c2e]/10 text-[#0f1c2e]",
  both: "bg-secondary/20 text-[#a87e00]",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("full_name, role, career, cycle, avatar_url")
    .eq("id", user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: schedules } = await (supabase.from("schedules") as any)
    .select("id, day_of_week, departure_time, direction")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("day_of_week")
    .order("departure_time");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: pendingCount } = await (supabase.from("trip_requests") as any)
    .select("*", { count: "exact", head: true })
    .eq("passenger_id", user.id)
    .eq("status", "pending");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: openTripsCount } = await (supabase.from("trips") as any)
    .select("*", { count: "exact", head: true })
    .eq("driver_id", user.id)
    .eq("status", "open");

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const dayLabel = now.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // 0=Mon..5=Sat (schedules convention)
  const todayScheduleDay = (now.getDay() + 6) % 7;

  const role = profile?.role as UserRole;
  const isDriver = role === "driver" || role === "both";
  const isPassenger = role === "passenger" || role === "both";
  const initial = profile?.full_name?.[0]?.toUpperCase() ?? "U";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const todaySchedules = (schedules ?? []).filter((s: any) => s.day_of_week === todayScheduleDay);

  const scheduleCount = (schedules ?? []).length;
  const tripsStatValue = isDriver ? (openTripsCount ?? 0) : (pendingCount ?? 0);
  const tripsStatLabel = isDriver ? "Viajes activos" : "Solicitudes";

  const actionCount = (isPassenger ? 1 : 0) + (isDriver ? 1 : 0) + 1;
  const gridCols = actionCount === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className="mx-auto max-w-3xl space-y-5">

      {/* ── Header card ── */}
      <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 ring-2 ring-primary/20">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-heading text-xl font-bold text-primary">{initial}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground capitalize">{greeting}, {dayLabel}</p>
          <h1 className="font-heading text-2xl font-bold text-dark leading-tight">
            {profile?.full_name ?? "—"}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_COLOR[role] ?? "bg-surface text-dark"}`}>
              {ROLE_LABEL[role] ?? role}
            </span>
            {profile?.career && (
              <span className="text-[11px] text-muted-foreground">
                {profile.career} · Ciclo {profile.cycle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={Calendar}
          label="Horarios"
          value={scheduleCount}
          colorClass="bg-primary/10 text-primary"
        />
        <StatCard
          icon={Bell}
          label="Solicitudes"
          value={pendingCount ?? 0}
          colorClass="bg-secondary/20 text-[#a87e00]"
        />
        <StatCard
          icon={Car}
          label={tripsStatLabel}
          value={tripsStatValue}
          colorClass="bg-surface text-dark"
        />
      </div>

      {/* ── Hoy ── */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h2 className="font-heading text-sm font-bold text-dark">
            Hoy, <span className="capitalize">{DAYS_LONG[todayScheduleDay] ?? "—"}</span>
          </h2>
          <span className="text-[11px] text-muted-foreground capitalize">
            {now.toLocaleDateString("es-PE", { day: "numeric", month: "long" })}
          </span>
        </div>
        {todaySchedules.length > 0 ? (
          <div className="divide-y divide-border/50">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {todaySchedules.map((s: any) => {
              const isToUtec = s.direction === "to_utec";
              return (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    {DAYS[s.day_of_week]}
                  </span>
                  <span className="text-sm font-semibold text-dark">
                    {s.departure_time?.slice(0, 5)}
                  </span>
                  <span
                    className={`ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      isToUtec ? "bg-primary/10 text-primary" : "bg-secondary/20 text-[#a87e00]"
                    }`}
                  >
                    {isToUtec ? "→ UTEC" : "← Casa"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">Sin horarios para hoy</p>
          </div>
        )}
      </div>

      {/* ── Acciones rápidas ── */}
      <div className={`grid ${gridCols} gap-3`}>
        {isPassenger && (
          <Link
            href="/buscar"
            className="flex flex-col gap-2 rounded-2xl bg-primary p-4 text-white transition-opacity hover:opacity-90"
          >
            <Search className="h-5 w-5" />
            <p className="font-heading text-sm font-bold">Buscar viaje</p>
            <p className="text-[11px] text-white/70">Encontrá tu ruta</p>
          </Link>
        )}
        {isDriver && (
          <Link
            href="/publicar"
            className="flex flex-col gap-2 rounded-2xl p-4 text-white transition-opacity hover:opacity-90"
            style={{ background: "#0f1c2e" }}
          >
            <Plus className="h-5 w-5" />
            <p className="font-heading text-sm font-bold">Publicar viaje</p>
            <p className="text-[11px] text-white/60">Ofrecé asientos</p>
          </Link>
        )}
        <Link
          href="/viajes"
          className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-4 text-dark transition-shadow hover:shadow-md"
        >
          <Car className="h-5 w-5 text-muted-foreground" />
          <p className="font-heading text-sm font-bold">Mis viajes</p>
          <p className="text-[11px] text-muted-foreground">Ver solicitudes</p>
        </Link>
      </div>

      {/* ── Semana ── */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="font-heading text-sm font-bold text-dark">Esta semana</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto px-5 py-4 scrollbar-none">
          {DAYS.map((day, idx) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const daySchedules = (schedules ?? []).filter((s: any) => s.day_of_week === idx);
            const hasSchedule = daySchedules.length > 0;
            const isToday = idx === todayScheduleDay;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const firstTime = daySchedules[0]?.departure_time?.slice(0, 5);

            return (
              <div key={idx} className="flex shrink-0 flex-col items-center gap-1.5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    hasSchedule
                      ? isToday
                        ? "bg-primary text-white ring-2 ring-primary/30"
                        : "bg-primary/15 text-primary"
                      : isToday
                        ? "border-2 border-primary text-primary"
                        : "border border-border text-muted-foreground"
                  }`}
                >
                  {day}
                </div>
                {hasSchedule && (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {firstTime}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pendientes ── */}
      {(pendingCount ?? 0) > 0 && (
        <Link
          href="/viajes"
          className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/20">
              <Bell className="h-4 w-4 text-[#a87e00]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-dark">Solicitudes pendientes</p>
              <p className="text-[11px] text-muted-foreground">
                {pendingCount} en espera de confirmación
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  colorClass: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-heading text-2xl font-bold text-dark">{value}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}
