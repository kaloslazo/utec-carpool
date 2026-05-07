"use client";

import { useRef } from "react";
import { Camera } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CAREERS } from "@/lib/constants";
import type { Gender } from "@/lib/supabase/types";

export interface ProfileData {
  full_name: string;
  gender: Gender | "";
  age: string;
  career: string;
  cycle: string;
  avatar?: File;
  avatarPreview?: string;
}

interface Props {
  value: ProfileData;
  onChange: (data: ProfileData) => void;
}

const GENDERS: { value: Gender; label: string }[] = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Femenino" },
  { value: "other", label: "Otro" },
  { value: "prefer_not_to_say", label: "Prefiero no decir" },
];


export default function Step2Profile({ value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof ProfileData>(key: K, val: ProfileData[K]) {
    onChange({ ...value, [key]: val });
  }

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange({ ...value, avatar: file, avatarPreview: url });
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <h2 className="mb-1 font-heading text-xl font-bold text-dark">
        Cuéntanos sobre ti
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Esta info la ven los conductores y pasajeros al solicitar un viaje.
      </p>

      {/* Avatar */}
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-surface hover:border-primary transition-colors"
        >
          {value.avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.avatarPreview}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <Camera className="h-6 w-6 text-muted-foreground" />
          )}
        </button>
        <div>
          <p className="text-sm font-medium text-dark">Foto de perfil</p>
          <p className="text-xs text-muted-foreground">
            Opcional · JPG o PNG, máx. 2 MB
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-1 text-xs font-semibold text-primary hover:underline"
          >
            {value.avatarPreview ? "Cambiar foto" : "Subir foto"}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={handleAvatar}
        />
      </div>

      {/* Fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Full name */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-sm font-medium text-dark">
            Nombre completo
          </Label>
          <Input
            value={value.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Tu nombre como aparece en tu carnet"
            className=""
            required
          />
        </div>

        {/* Gender */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-dark">Género</Label>
          <Select
            value={value.gender}
            onChange={(e) => set("gender", e.target.value as Gender)}
            required
          >
            <option value="">Selecciona…</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Age */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-dark">Edad</Label>
          <Input
            type="number"
            min={16}
            max={99}
            value={value.age}
            onChange={(e) => set("age", e.target.value)}
            placeholder="Ej: 20"
            className=""
            required
          />
        </div>

        {/* Career */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-sm font-medium text-dark">Carrera</Label>
          <Select
            value={value.career}
            onChange={(e) => set("career", e.target.value)}
            required
          >
            <option value="">Selecciona tu carrera…</option>
            {CAREERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        {/* Cycle */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-dark">Ciclo actual</Label>
          <Select
            value={value.cycle}
            onChange={(e) => set("cycle", e.target.value)}
            required
          >
            <option value="">Ciclo…</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => (
              <option key={c} value={c}>
                {c}º ciclo
              </option>
            ))}
          </Select>
        </div>
      </div>
    </motion.div>
  );
}
