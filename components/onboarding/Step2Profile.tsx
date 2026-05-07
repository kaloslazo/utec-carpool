"use client";

import { useRef } from "react";
import { Camera, User } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownSelect } from "@/components/ui/dropdown-select";
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

const GENDER_OPTIONS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Femenino" },
  { value: "other", label: "Otro" },
  { value: "prefer_not_to_say", label: "Prefiero no decir" },
];

const CAREER_OPTIONS = CAREERS.map((c) => ({ value: c, label: c }));

const CYCLE_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}° ciclo`,
}));

export default function Step2Profile({ value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof ProfileData>(key: K, val: ProfileData[K]) {
    onChange({ ...value, [key]: val });
  }

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({ ...value, avatar: file, avatarPreview: URL.createObjectURL(file) });
  }

  const initial = value.full_name?.[0]?.toUpperCase();

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
      <p className="mb-8 text-sm text-muted-foreground">
        Esta info la ven los conductores y pasajeros al coordinar un viaje.
      </p>

      {/* Avatar */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-surface transition-colors hover:border-primary"
        >
          {value.avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.avatarPreview}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : initial ? (
            <span className="font-heading text-2xl font-bold text-primary">{initial}</span>
          ) : (
            <User className="h-8 w-8 text-muted-foreground/50" />
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/20">
            <Camera className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {value.avatarPreview ? "Cambiar foto" : "Subir foto de perfil"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={handleAvatar}
        />
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {/* Full name */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-dark">Nombre completo</Label>
          <Input
            value={value.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Como aparece en tu carnet"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Gender */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-dark">Género</Label>
            <DropdownSelect
              value={value.gender}
              onChange={(v) => set("gender", v as Gender)}
              options={GENDER_OPTIONS}
              placeholder="Selecciona..."
              required
            />
          </div>

          {/* Age */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-dark">Edad</Label>
            <Input
              type="number"
              min={16}
              max={35}
              value={value.age}
              onChange={(e) => {
                const n = parseInt(e.target.value);
                if (!e.target.value || (n >= 16 && n <= 35)) set("age", e.target.value);
              }}
              placeholder="Ej: 20"
              required
            />
          </div>
        </div>

        {/* Career */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-dark">Carrera</Label>
          <DropdownSelect
            value={value.career}
            onChange={(v) => set("career", v)}
            options={CAREER_OPTIONS}
            placeholder="Selecciona tu carrera..."
            required
          />
        </div>

        {/* Cycle */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-dark">Ciclo actual</Label>
          <DropdownSelect
            value={value.cycle}
            onChange={(v) => set("cycle", v)}
            options={CYCLE_OPTIONS}
            placeholder="¿En qué ciclo estás?"
            required
          />
        </div>
      </div>
    </motion.div>
  );
}
