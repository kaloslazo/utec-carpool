import { redirect } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Calendar, Clock, ArrowRight, MapPin, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const ROLE_LABEL: Record<UserRole, string> = {
  passenger: "Pasajero",
  driver: "Conductor",
  both: "Conductor · Pasajero",
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
  const { count: scheduleCount } = await (supabase.from("schedules") as any)
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: pendingCount } = await (supabase.from("trip_requests") as any)
    .select("*", { count: "exact", head: true })
    .eq("passenger_id", user.id)
    .eq("status", "pending");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: schedules } = await (supabase.from("schedules") as any)
    .select("id, day_of_week, departure_time, direction")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .order("departure_time", { ascending: true })
    .limit(6);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const role = profile?.role as UserRole;
  const isDriver = role === "driver" || role === "both";
  const isPassenger = role === "passenger" || role === "both";
  const initial = profile?.full_name?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* ── Hero banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: "linear-gradient(135deg, #00BFFF 0%, #0090cc 60%, #006fa6 100%)" }}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-14 left-4 h-32 w-32 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-24 top-4 h-12 w-12 rounded-full bg-white/10" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/70">{greeting}</p>
            <h1 className="mt-0.5 font-heading text-2xl font-bold leading-tight">
              {profile?.full_name ?? "—"}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm">
                <Zap className="h-3 w-3" />
                {ROLE_LABEL[role] ?? role}
              </span>
              {profile?.career && (
                <span className="text-xs text-white/60">
                  {profile.career} · Ciclo {profile.cycle}
                </span>
              )}
            </div>
          </div>

          {/* Avatar */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 ring-2 ring-white/40 backdrop-blur-sm">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-heading text-xl font-bold text-white">
                {initial}
              </span>
            )}
          </div>
        </div>

        {/* Quick CTA row */}
        <div className="relative mt-5 flex flex-wrap gap-2">
          {isPassenger && (
            <Link
              href="/buscar"
              className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-primary shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
            >
              <Search className="h-3.5 w-3.5" />
              Buscar viaje
            </Link>
          )}
          {isDriver && (
            <Link
              href="/publicar"
              className="flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm transition-all hover:bg-white/30"
            >
              <Plus className="h-3.5 w-3.5" />
              Publicar viaje
            </Link>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={Calendar}
          label="Horarios activos"
          value={scheduleCount ?? 0}
          color="primary"
        />
        <StatCard
          icon={Clock}
          label="Solicitudes pendientes"
          value={pendingCount ?? 0}
          color="secondary"
        />
        <StatCard
          icon={MapPin}
          label="Destino"
          value="UTEC"
          color="dark"
          small
        />
      </div>

      {/* ── Action cards (desktop-style) ── */}
      <div className={`grid gap-4 ${isDriver && isPassenger ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
        {isPassenger && (
          <Link href="/buscar" className="group">
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-white p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/10">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-125" />
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary">
                <Search className="h-5 w-5 text-primary transition-colors group-hover:text-white" />
              </div>
              <p className="font-heading text-base font-bold text-dark">
                Buscar viaje
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Encuentra conductores cerca de tu casa hacia UTEC
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
                Buscar ahora
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        )}
        {isDriver && (
          <Link href="/publicar" className="group">
            <div className="relative overflow-hidden rounded-2xl border border-secondary/30 bg-white p-5 shadow-sm transition-all hover:border-secondary/50 hover:shadow-md hover:shadow-secondary/10">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-secondary/5 transition-transform group-hover:scale-125" />
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/15 transition-colors group-hover:bg-secondary">
                <Plus className="h-5 w-5 text-secondary-foreground transition-colors group-hover:text-dark" />
              </div>
              <p className="font-heading text-base font-bold text-dark">
                Publicar viaje
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ofrece asientos para compañeros que van a UTEC
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-secondary-foreground">
                Publicar ahora
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* ── Schedule section ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="font-heading text-sm font-bold text-dark">
            Mis horarios
          </h2>
          <Link
            href="/perfil"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Ver todos
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {schedules && schedules.length > 0 ? (
          <div className="divide-y divide-border/60">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {schedules.map((s: any) => {
              const isToUtec = s.direction === "to_utec";
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface/40"
                >
                  {/* Day + time pill */}
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-surface">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-primary">
                      {DAYS[s.day_of_week]}
                    </span>
                    <span className="text-xs font-bold text-dark">
                      {s.departure_time?.slice(0, 5)}
                    </span>
                  </div>

                  {/* Connector */}
                  <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />

                  {/* Direction badge */}
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                      isToUtec
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary/20 text-secondary-foreground"
                    }`}
                  >
                    {isToUtec ? "→ UTEC" : "← Casa"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
              <Calendar className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-semibold text-dark">Sin horarios aún</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Agrega tus horarios para encontrar compañeros de viaje.
            </p>
            <Link
              href="/perfil"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar horarios
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  small = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: "primary" | "secondary" | "dark";
  small?: boolean;
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/15 text-secondary-foreground",
    dark: "bg-surface text-dark",
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white p-4 shadow-sm">
      <div
        className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg ${colorMap[color]}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p
        className={`font-heading font-bold text-dark ${small ? "text-base leading-tight" : "text-2xl"}`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
