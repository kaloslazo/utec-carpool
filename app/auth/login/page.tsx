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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos."
          : authError.message
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
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
          Bienvenido de nuevo
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Ingresa a tu cuenta de UTEC Carpool
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
            className="h-10 rounded-lg border-border text-sm focus-visible:border-primary focus-visible:ring-primary/20"
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
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10 rounded-lg border-border pr-10 text-sm focus-visible:border-primary focus-visible:ring-primary/20"
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

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          className="mt-2 h-10 w-full bg-primary text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Ingresando…
            </span>
          ) : (
            "Iniciar sesión"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-muted-foreground">
            ¿Primera vez?
          </span>
        </div>
      </div>

      {/* Register link */}
      <Link href="/auth/register">
        <Button
          variant="outline"
          className="w-full border-border text-sm font-semibold text-dark hover:bg-surface"
        >
          Crear una cuenta nueva
        </Button>
      </Link>
    </motion.div>
  );
}
