"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-xl border border-border bg-surface">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
});

export interface LocationData {
  lat: number | null;
  lng: number | null;
  address: string;
}

interface Props {
  value: LocationData;
  onChange: (data: LocationData) => void;
}

export default function Step3Location({ value, onChange }: Props) {
  const mapValue =
    value.lat !== null && value.lng !== null
      ? { lat: value.lat, lng: value.lng, address: value.address }
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <h2 className="mb-1 font-heading text-xl font-bold text-dark">
        ¿Desde dónde sales?
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Marca tu punto de partida habitual. Los conductores calcularán si te
        queda de camino a UTEC Barranco.
      </p>

      <MapPicker
        value={mapValue}
        onChange={({ lat, lng, address }) => onChange({ lat, lng, address })}
      />

      {!value.lat && (
        <p className="mt-3 text-xs text-muted-foreground">
          * Este paso es necesario para que el algoritmo encuentre conductores
          cercanos.
        </p>
      )}
    </motion.div>
  );
}
