"use client";

import { useEffect, useState } from "react";
import { Calendar, Info, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WeeklyScheduleGrid, {
  emptyGrid,
  TIME_SLOTS,
} from "@/components/WeeklyScheduleGrid";
import { cn } from "@/lib/utils";
import type { CalendarSchedule } from "@/lib/google-calendar";

export interface ScheduleData {
  to_utec: boolean[][];
  from_utec: boolean[][];
}

export function emptySchedule(): ScheduleData {
  return { to_utec: emptyGrid(), from_utec: emptyGrid() };
}

export function scheduleToRecords(
  data: ScheduleData
): {
  day_of_week: number;
  departure_time: string;
  direction: "to_utec" | "from_utec";
}[] {
  const records: ReturnType<typeof scheduleToRecords> = [];
  (["to_utec", "from_utec"] as const).forEach((dir) => {
    data[dir].forEach((daySlots, day) => {
      daySlots.forEach((active, slot) => {
        if (active)
          records.push({
            day_of_week: day,
            departure_time: TIME_SLOTS[slot],
            direction: dir,
          });
      });
    });
  });
  return records;
}

type Tab = "to_utec" | "from_utec";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface Props {
  value: ScheduleData;
  onChange: (data: ScheduleData) => void;
  onConnectCalendar?: () => void;
}

function readCalendarCookie(): CalendarSchedule | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(^| )calendar_import=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[2]));
  } catch {
    return null;
  }
}

function deleteCalendarCookie() {
  document.cookie =
    "calendar_import=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

function mergeSchedules(
  current: ScheduleData,
  imported: CalendarSchedule
): ScheduleData {
  return {
    to_utec: current.to_utec.map((row, d) =>
      row.map((v, s) => v || (imported.to_utec[d]?.[s] ?? false))
    ),
    from_utec: current.from_utec.map((row, d) =>
      row.map((v, s) => v || (imported.from_utec[d]?.[s] ?? false))
    ),
  };
}

function summarizeSlots(grid: boolean[][]): string {
  const slots: string[] = [];
  grid.forEach((daySlots, d) => {
    daySlots.forEach((active, s) => {
      if (active) slots.push(`${DAYS[d]} ${TIME_SLOTS[s]}`);
    });
  });
  if (slots.length === 0) return "ninguno";
  if (slots.length <= 4) return slots.join(", ");
  return `${slots.slice(0, 4).join(", ")} +${slots.length - 4} más`;
}

export default function Step4Schedule({ value, onChange, onConnectCalendar }: Props) {
  const [tab, setTab] = useState<Tab>("to_utec");
  const [importPreview, setImportPreview] = useState<CalendarSchedule | null>(null);

  useEffect(() => {
    const imported = readCalendarCookie();
    if (imported) {
      const total =
        imported.to_utec.flat().filter(Boolean).length +
        imported.from_utec.flat().filter(Boolean).length;
      if (total > 0) setImportPreview(imported);
      else deleteCalendarCookie();
    }
  }, []);

  function handleAcceptImport() {
    if (!importPreview) return;
    onChange(mergeSchedules(value, importPreview));
    deleteCalendarCookie();
    setImportPreview(null);
  }

  function handleRejectImport() {
    deleteCalendarCookie();
    setImportPreview(null);
  }

  function handleToggle(day: number, slot: number) {
    const grid = value[tab].map((row, d) =>
      d === day ? row.map((v, s) => (s === slot ? !v : v)) : row
    );
    onChange({ ...value, [tab]: grid });
  }

  const toCount = value.to_utec.flat().filter(Boolean).length;
  const fromCount = value.from_utec.flat().filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <h2 className="mb-1 font-heading text-xl font-bold text-dark">
        ¿Cuándo viajas?
      </h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Selecciona tus horarios habituales. Después puedes editarlos desde tu perfil.
      </p>

      {/* Import preview banner */}
      <AnimatePresence>
        {importPreview && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 overflow-hidden rounded-xl border border-primary/30 bg-primary/5"
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark">
                  Horarios importados desde Google Calendar
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <span className="font-medium text-dark">→ UTEC:</span>{" "}
                  {summarizeSlots(importPreview.to_utec)}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-dark">← Casa:</span>{" "}
                  {summarizeSlots(importPreview.from_utec)}
                </p>
                <div className="mt-2.5 flex gap-2">
                  <button
                    type="button"
                    onClick={handleAcceptImport}
                    className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary/90"
                  >
                    Importar
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectImport}
                    className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-dark hover:bg-surface"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRejectImport}
                className="shrink-0 text-muted-foreground hover:text-dark"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Calendar connect */}
      <button
        type="button"
        className="mb-5 flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-border bg-white px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-surface/40"
        onClick={onConnectCalendar}
      >
        <Calendar className="h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold text-dark">
            Conecta tu Google Calendar
          </p>
          <p className="text-xs text-muted-foreground">
            Importa tus clases de UTEC automáticamente
          </p>
        </div>
      </button>

      {/* Divider */}
      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-muted-foreground">
            o completa manualmente
          </span>
        </div>
      </div>

      {/* Direction tabs */}
      <div className="mb-4 flex gap-2">
        {(["to_utec", "from_utec"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors",
              tab === t
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-dark hover:bg-surface"
            )}
          >
            {t === "to_utec" ? "→ Hacia UTEC" : "← Desde UTEC"}
            {t === "to_utec" && toCount > 0 && (
              <span
                className={cn(
                  "ml-1.5 text-[10px]",
                  tab === t ? "text-white/70" : "text-primary"
                )}
              >
                ({toCount})
              </span>
            )}
            {t === "from_utec" && fromCount > 0 && (
              <span
                className={cn(
                  "ml-1.5 text-[10px]",
                  tab === t ? "text-white/70" : "text-primary"
                )}
              >
                ({fromCount})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <WeeklyScheduleGrid selected={value[tab]} onToggle={handleToggle} />

      {/* Info */}
      <div className="mt-3 flex items-start gap-2">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Haz clic en una celda para marcarla. Puedes seleccionar varios
          horarios por día.
        </p>
      </div>

      {toCount + fromCount === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          * Si no marcas horarios, igual puedes buscar viajes puntualmente desde
          el dashboard.
        </p>
      )}
    </motion.div>
  );
}
