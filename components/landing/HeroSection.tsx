"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Car, MapPin, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const floatingCards = [
  {
    icon: Car,
    label: "Match encontrado",
    sub: "3 conductores disponibles",
    delay: 0,
    position: "top-8 right-4 sm:right-12",
  },
  {
    icon: MapPin,
    label: "Av. Arequipa → UTEC",
    sub: "Salida 7:30 AM",
    delay: 0.15,
    position: "top-44 right-0 sm:right-4",
  },
  {
    icon: Shield,
    label: "Conductor verificado",
    sub: "Placa ABC-123",
    delay: 0.3,
    position: "bottom-20 right-8 sm:right-16",
  },
];

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
      {/* Background gradient blob */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-[70%] w-[55%] rounded-bl-[80px] opacity-15"
        style={{ background: "linear-gradient(135deg, #00BFFF, #E1EEFF)" }}
      />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-surface opacity-60 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        {/* Left — content */}
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Badge */}
            <span className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-surface px-4 py-1.5 text-xs font-semibold text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Solo para estudiantes @utec.edu.pe
            </span>

            {/* Heading */}
            <h1 className="mb-5 font-heading text-4xl font-bold leading-tight text-dark sm:text-5xl lg:text-6xl">
              Viaja con alguien de{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #00BFFF, #0080aa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                tu universidad
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mb-8 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Carpooling seguro y económico para estudiantes de UTEC. Conéctate
              con conductores y pasajeros que hacen el mismo recorrido que tú.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/register">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="h-11 gap-2 bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90">
                    Empezar gratis
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/auth/login">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    className="h-11 border-border px-6 text-sm font-semibold text-dark hover:bg-surface"
                  >
                    Iniciar sesión
                  </Button>
                </motion.div>
              </Link>
            </div>

            {/* Social proof */}
            <p className="mt-6 text-xs text-muted-foreground">
              Ya se unieron más de{" "}
              <span className="font-semibold text-dark">500 estudiantes</span>{" "}
              de UTEC
            </p>
          </motion.div>
        </div>

        {/* Right — floating UI cards */}
        <div className="relative hidden lg:flex lg:items-center lg:justify-center">
          {/* Central circle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex h-64 w-64 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, #00BFFF22, #E1EEFF88)" }}
          >
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/10">
              <Image src="/logo.png" alt="UTEC Carpool" width={56} height={56} className="rounded-lg" />
            </div>
            {/* Orbit ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20" />
          </motion.div>

          {/* Floating info cards */}
          {floatingCards.map(({ icon: Icon, label, sub, delay, position }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + delay }}
              className={`absolute ${position} card-shadow flex min-w-[180px] items-center gap-3 rounded-xl bg-white p-3.5`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-dark">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-1">
          <div className="h-8 w-[1.5px] rounded-full bg-gradient-to-b from-primary/60 to-transparent" />
        </div>
      </motion.div>
    </section>
  );
}
