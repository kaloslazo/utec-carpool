"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Rol", "Perfil", "Ubicación", "Horario"];

interface Props {
  current: number; // 1-based
}

export default function StepIndicator({ current }: Props) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = current > step;
        const active = current === step;

        return (
          <div key={label} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                  done
                    ? "border-primary bg-primary text-white"
                    : active
                      ? "border-primary bg-white text-primary"
                      : "border-border bg-white text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : step}
              </div>
              <span
                className={cn(
                  "hidden text-[10px] font-medium sm:block",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>

            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 mb-4 h-[2px] w-10 sm:w-16 transition-colors",
                  done ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
