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
  role?: string | null;
}

export default function Step3Location({ value, onChange, role }: Props) {
  const isDriver = role === "driver";
  const isPassenger = role === "passenger";
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
        {isPassenger ? "¿Dónde te recogen?" : "¿Desde dónde sales?"}
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        {isPassenger
          ? "Indica tu casa o el punto donde prefieres que te recojan. Los conductores verán si les queda de camino hacia UTEC Barranco."
          : isDriver
            ? "Indica tu dirección de salida habitual. Así encontramos pasajeros que estén cerca de tu ruta a UTEC Barranco."
            : "Indica tu ubicación habitual. Se usa para emparejarte con rutas cercanas a UTEC Barranco."
        }
      </p>

      <MapPicker
        value={mapValue}
        onChange={({ lat, lng, address }) => onChange({ lat, lng, address })}
      />

      {!value.lat && (
        <p className="mt-3 text-xs text-muted-foreground">
          {isPassenger
            ? "* Necesitamos tu punto de recogida para mostrarte conductores que pasen cerca."
            : "* Necesitamos tu dirección para encontrar pasajeros en tu ruta."
          }
        </p>
      )}
    </motion.div>
  );
}
