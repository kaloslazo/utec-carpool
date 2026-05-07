"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UTEC_EMAIL_DOMAIN } from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function validate(): string {
    if (!email.endsWith(UTEC_EMAIL_DOMAIN))
      return `El email debe terminar en ${UTEC_EMAIL_DOMAIN}`;
    if (password.length < 8)
      return "La contraseña debe tener al menos 8 caracteres";
    if (password !== confirmPassword) return "Las contraseñas no coinciden";
    return "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(
        authError.message === "User already registered"
          ? "Ya existe una cuenta con este email."
          : authError.message
      );
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      {/* Mobile logo */}
      <div className="mb-8 flex items-center gap-2 lg:hidden">
        <Image src="/logo.png" alt="UTEC Carpool" width={32} height={32} className="rounded-lg" />
        <span className="font-heading text-lg font-bold text-dark">
          UTEC Carpool
        </span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-dark">
          Crea tu cuenta
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Ingresa con tu email institucional de UTEC
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-dark">
            Email institucional
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="tu.nombre@utec.edu.pe"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className=""
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-dark">
            Contraseña
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-dark"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-dark"
          >
            Confirma tu contraseña
          </Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className=""
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 w-full bg-primary text-base font-bold text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creando cuenta…
            </span>
          ) : (
            "Crear cuenta"
          )}
        </Button>
      </form>

      {/* Login link */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-primary hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </motion.div>
  );
}
