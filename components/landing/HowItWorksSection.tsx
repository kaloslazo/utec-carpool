"use client";

import { UserCheck, Search, Banknote } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    icon: UserCheck,
    title: "Regístrate con tu email UTEC",
    description:
      "Crea tu cuenta con tu dirección @utec.edu.pe. Solo estudiantes activos pueden unirse a la comunidad.",
  },
  {
    number: "02",
    icon: Search,
    title: "Encuentra o publica un viaje",
    description:
      "Busca conductores que pasen cerca de tu casa hacia UTEC, o publica tu viaje si tienes auto y quieres compartir gastos.",
  },
  {
    number: "03",
    icon: Banknote,
    title: "Viaja y paga con Yape",
    description:
      "Coordina el punto de encuentro en el mapa y paga el viaje directo al conductor con Yape. Simple y sin efectivo.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <span className="mb-3 inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold text-primary">
            Cómo funciona
          </span>
          <h2 className="font-heading text-3xl font-bold text-dark sm:text-4xl">
            Tres pasos y ya estás viajando
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
            Sin complicaciones. En menos de 5 minutos puedes tener tu primer viaje coordinado.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map(({ number, icon: Icon, title, description }, index) => (
            <motion.div
              key={number}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="card-shadow group relative rounded-xl border border-border bg-white p-6 transition-colors hover:border-primary/30 hover:bg-surface/30"
            >
              {/* Step number */}
              <span className="mb-4 inline-block font-heading text-5xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors">
                {number}
              </span>

              {/* Icon */}
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-surface">
                <Icon className="h-5 w-5 text-primary" />
              </div>

              {/* Content */}
              <h3 className="mb-2 font-heading text-lg font-bold text-dark">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>

              {/* Connector line (except last) */}
              {index < steps.length - 1 && (
                <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 sm:block">
                  <div className="h-[2px] w-6 bg-gradient-to-r from-border to-transparent" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
