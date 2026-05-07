"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { User, MapPin, Calendar, Save, Loader2, CheckCircle, AlertCircle, Plus, Trash2, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/supabase/types";
import { emptyGrid, TIME_SLOTS } from "@/components/WeeklyScheduleGrid";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const CAREERS = ["Ingeniería de Sistemas", "Ingeniería Industrial", "Ingeniería Civil", "Administración", "Economía", "Derecho", "Negocios Internacionales", "Arquitectura"];

const WeeklyScheduleGrid = dynamic(() => import("@/components/WeeklyScheduleGrid"), { ssr: false });
const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-xl bg-surface">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  ),
});

interface ProfileData {
  full_name: string;
  career: string;
  cycle: number;
  role: UserRole;
  avatar_url: string | null;
}

interface LocationData {
  lat: number | null;
  lng: number | null;
  address: string;
}

interface ScheduleRow {
  id: string;
  day_of_week: number;
  departure_time: string;
  direction: "to_utec" | "from_utec";
}

type Tab = "info" | "horarios" | "ubicacion";

function roleBadge(role: UserRole) {
  if (role === "driver") return { label: "Conductor", classes: "bg-[#0f1c2e] text-white" };
  if (role === "both") return { label: "Conductor · Pasajero", classes: "bg-primary text-white" };
  return { label: "Pasajero", classes: "bg-primary/10 text-primary" };
}

export default function PerfilPage() {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [profile, setProfile] = useState<ProfileData>({ full_name: "", career: "", cycle: 1, role: "passenger", avatar_url: null });
  const [location, setLocation] = useState<LocationData>({ lat: null, lng: null, address: "" });
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [toUtecGrid, setToUtecGrid] = useState<boolean[][]>(emptyGrid());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [userId, setUserId] = useState<string>("");

  const showToast = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    async function fetchAll() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: p } = await (supabase.from("profiles") as any)
        .select("full_name, career, cycle, role, avatar_url")
        .eq("id", user.id)
        .single();
      if (p) setProfile(p);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: loc } = await (supabase.from("locations") as any)
        .select("lat, lng, address")
        .eq("user_id", user.id)
        .eq("is_home", true)
        .maybeSingle();
      if (loc) setLocation({ lat: loc.lat, lng: loc.lng, address: loc.address });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sched } = await (supabase.from("schedules") as any)
        .select("id, day_of_week, departure_time, direction")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("day_of_week")
        .order("departure_time");
      if (sched) setSchedules(sched);

      setLoading(false);
    }
    fetchAll();
  }, []);

  async function saveProfile() {
    setSaving(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("profiles") as any)
      .update({ full_name: profile.full_name, career: profile.career, cycle: profile.cycle })
      .eq("id", userId);
    showToast(error ? "Error al guardar perfil." : "Perfil actualizado.", !error);
    setSaving(false);
  }

  async function saveLocation() {
    if (!location.lat || !location.lng) {
      showToast("Seleccioná una ubicación en el mapa.", false);
      return;
    }
    setSaving(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("locations") as any)
      .upsert({
        user_id: userId,
        label: "Casa",
        lat: location.lat,
        lng: location.lng,
        address: location.address,
        is_home: true,
      }, { onConflict: "user_id" });
    showToast(error ? "Error al guardar ubicación." : "Ubicación actualizada.", !error);
    setSaving(false);
  }

  function handleGridToggle(day: number, slot: number) {
    setToUtecGrid(prev => {
      const next = prev.map(r => [...r]);
      next[day][slot] = !next[day][slot];
      return next;
    });
  }

  async function saveScheduleFromGrid() {
    setSaving(true);
    const supabase = createClient();
    const toInsert: Omit<ScheduleRow, "id">[] = [];
    toUtecGrid.forEach((daySlots, day) => {
      daySlots.forEach((active, slotIdx) => {
        if (active) {
          toInsert.push({
            day_of_week: day,
            departure_time: TIME_SLOTS[slotIdx] + ":00",
            direction: "to_utec",
          });
        }
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("schedules") as any).insert(
      toInsert.map(s => ({ ...s, user_id: userId, is_active: true }))
    );

    if (!error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sched } = await (supabase.from("schedules") as any)
        .select("id, day_of_week, departure_time, direction")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("day_of_week")
        .order("departure_time");
      setSchedules(sched ?? []);
      setToUtecGrid(emptyGrid());
    }
    showToast(error ? "Error al guardar horarios." : `${toInsert.length} horario(s) agregado(s).`, !error);
    setSaving(false);
  }

  async function deleteSchedule(id: string) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("schedules") as any).update({ is_active: false }).eq("id", id);
    setSchedules(prev => prev.filter(s => s.id !== id));
    showToast("Horario eliminado.", true);
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "info", label: "Información", icon: User },
    { id: "horarios", label: "Horarios", icon: Calendar },
    { id: "ubicacion", label: "Ubicación", icon: MapPin },
  ];

  const initial = profile.full_name?.[0]?.toUpperCase() ?? "U";
  const badge = roleBadge(profile.role);

  const selectedSlotCount = toUtecGrid.reduce(
    (acc, row) => acc + row.filter(Boolean).length,
    0
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">

      {/* Header card */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="bg-gradient-to-br from-primary/5 to-transparent px-5 pb-5 pt-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 ring-2 ring-primary/30">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-heading text-2xl font-bold text-primary">{initial}</span>
              )}
            </div>
            <div>
              <p className="font-heading text-lg font-bold text-dark">{profile.full_name || "—"}</p>
              <p className="text-sm text-muted-foreground">{profile.career} · Ciclo {profile.cycle}</p>
              <span className={cn("mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold", badge.classes)}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
              activeTab === id
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-dark"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      ) : (
        <>
          {/* ── Info tab ── */}
          {activeTab === "info" && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b border-border px-5 py-3.5">
                <p className="font-heading text-sm font-bold text-dark">Datos personales</p>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-dark">Nombre completo</label>
                  <Input
                    type="text"
                    value={profile.full_name}
                    onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-dark">Carrera</label>
                  <Select
                    value={profile.career}
                    onChange={e => setProfile(p => ({ ...p, career: e.target.value }))}
                  >
                    {CAREERS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-dark">Ciclo</label>
                  <Select
                    value={profile.cycle}
                    onChange={e => setProfile(p => ({ ...p, cycle: parseInt(e.target.value) }))}
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <option key={n} value={n}>Ciclo {n}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="border-t border-border px-5 py-4">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "info" && (profile.role === "driver" || profile.role === "both") && (
            <Link
              href="/conductor/verificacion"
              className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0f1c2e]/10">
                <Shield className="h-5 w-5 text-[#0f1c2e]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark">Verificación de conductor</p>
                <p className="text-xs text-muted-foreground">Completá los datos de tu vehículo y licencia</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          )}

          {/* ── Horarios tab ── */}
          {activeTab === "horarios" && (
            <div className="space-y-4">
              {schedules.length > 0 && (
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                  <div className="border-b border-border px-5 py-3.5">
                    <p className="font-heading text-sm font-bold text-dark">
                      Horarios activos ({schedules.length})
                    </p>
                  </div>
                  <div className="divide-y divide-border/60">
                    {schedules.map(s => (
                      <div key={s.id} className="flex items-center gap-4 px-5 py-3">
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
                        <button
                          onClick={() => deleteSchedule(s.id)}
                          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="border-b border-border px-5 py-3.5">
                  <p className="font-heading text-sm font-bold text-dark">Agregar horarios → UTEC</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Marcá los días y horarios en que normalmente vas a UTEC.
                  </p>
                </div>
                <div className="p-4">
                  {selectedSlotCount > 0 && (
                    <div className="mb-3 flex items-center gap-2 rounded-xl bg-primary/8 px-3 py-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-xs font-semibold text-primary">
                        {selectedSlotCount} {selectedSlotCount === 1 ? "horario seleccionado" : "horarios seleccionados"}
                      </span>
                    </div>
                  )}
                  <WeeklyScheduleGrid selected={toUtecGrid} onToggle={handleGridToggle} />
                </div>
                <div className="border-t border-border px-5 py-4">
                  <button
                    onClick={saveScheduleFromGrid}
                    disabled={saving || selectedSlotCount === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {saving ? "Guardando..." : "Agregar horarios seleccionados"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Ubicacion tab ── */}
          {activeTab === "ubicacion" && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b border-border px-5 py-3.5">
                <p className="font-heading text-sm font-bold text-dark">Ubicación de casa</p>
                <p className="text-xs text-muted-foreground">
                  Usamos esto para calcular rutas y emparejarte con conductores cercanos.
                </p>
              </div>
              <div className="p-4 space-y-4">
                {location.address && (
                  <div className="flex items-center gap-2 rounded-xl bg-surface px-3.5 py-2.5">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    <p className="text-xs text-dark truncate">{location.address}</p>
                  </div>
                )}
                <MapPicker
                  value={location.lat !== null && location.lng !== null ? { lat: location.lat, lng: location.lng, address: location.address } : null}
                  onChange={v => setLocation({ lat: v.lat, lng: v.lng, address: v.address })}
                />
              </div>
              <div className="border-t border-border px-5 py-4">
                <button
                  onClick={saveLocation}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Guardando..." : "Guardar ubicación"}
                </button>
              </div>
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
          {toast.ok
            ? <CheckCircle className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
