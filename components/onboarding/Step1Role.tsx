"use client";

import { Users, Car, Shuffle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/supabase/types";

const ROLES: { value: UserRole; icon: React.ElementType; label: string; description: string }[] = [
  {
    value: "passenger",
    icon: Users,
    label: "Pasajero",
    description: "Busca conductores que te lleven a UTEC y comparte los gastos.",
  },
  {
    value: "driver",
    icon: Car,
    label: "Conductor",
    description: "Tienes auto y quieres compartir el viaje con compañeros.",
  },
  {
    value: "both",
    icon: Shuffle,
    label: "Ambos",
    description: "A veces manejas, a veces vas de pasajero. Elige según el día.",
  },
];

interface Props {
  value: UserRole | null;
  onChange: (role: UserRole) => void;
}

export default function Step1Role({ value, onChange }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <h2 className="mb-1 font-heading text-xl font-bold text-dark">
        ¿Cómo vas a usar UTEC Carpool?
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Puedes cambiar esto más adelante desde tu perfil.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {ROLES.map(({ value: roleValue, icon: Icon, label, description }) => {
          const selected = value === roleValue;
          return (
            <motion.button
              key={roleValue}
              type="button"
              onClick={() => onChange(roleValue)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-colors",
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-white hover:border-primary/40 hover:bg-surface/50"
              )}
            >
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl",
                  selected ? "bg-primary" : "bg-surface"
                )}
              >
                <Icon
                  className={cn(
                    "h-7 w-7",
                    selected ? "text-white" : "text-primary"
                  )}
                />
              </div>
              <div>
                <p className="font-heading text-base font-bold text-dark">
                  {label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>

              {selected && (
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
