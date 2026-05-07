"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { DAYS_OF_WEEK } from "@/lib/constants";

const START_HOUR = 6;
const TOTAL_SLOTS = 32; // 06:00 → 21:30

const TIME_SLOTS: string[] = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
  const total = START_HOUR * 60 + i * 30;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

interface Props {
  selected: boolean[][];
  onToggle: (day: number, slot: number) => void;
}

function emptyGrid(): boolean[][] {
  return Array.from({ length: 6 }, () => Array(TOTAL_SLOTS).fill(false));
}

export { emptyGrid, TIME_SLOTS };

export default function WeeklyScheduleGrid({ selected, onToggle }: Props) {
  const dayAbbr = useMemo(
    () => DAYS_OF_WEEK.map((d) => d.slice(0, 3)),
    []
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <div className="min-w-[420px]">
        {/* Header row */}
        <div className="grid border-b border-border bg-surface/50"
          style={{ gridTemplateColumns: "56px repeat(6, 1fr)" }}>
          <div className="border-r border-border py-2" />
          {dayAbbr.map((d) => (
            <div
              key={d}
              className="border-r border-border py-2 text-center text-xs font-semibold text-dark last:border-r-0"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Slots */}
        <div className="max-h-72 overflow-y-auto">
          {TIME_SLOTS.map((time, slotIdx) => (
            <div
              key={time}
              className="grid border-b border-border/50 last:border-b-0"
              style={{ gridTemplateColumns: "56px repeat(6, 1fr)" }}
            >
              {/* Time label */}
              <div className="border-r border-border/50 flex items-center justify-center py-1.5">
                <span className="text-[10px] text-muted-foreground">{time}</span>
              </div>

              {/* Cells */}
              {Array.from({ length: 6 }, (_, dayIdx) => {
                const active = selected[dayIdx]?.[slotIdx] ?? false;
                return (
                  <button
                    key={dayIdx}
                    type="button"
                    onClick={() => onToggle(dayIdx, slotIdx)}
                    className={cn(
                      "border-r border-border/50 py-1.5 last:border-r-0 transition-colors",
                      active
                        ? "bg-primary/20 hover:bg-primary/30"
                        : "hover:bg-surface"
                    )}
                  >
                    {active && (
                      <div className="mx-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
