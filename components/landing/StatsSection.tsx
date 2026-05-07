"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { Users, Car, TrendingDown } from "lucide-react";

interface Stat {
  icon: React.ElementType;
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  description: string;
}

const stats: Stat[] = [
  {
    icon: Users,
    value: 500,
    suffix: "+",
    label: "Estudiantes registrados",
    description: "De todas las carreras de UTEC",
  },
  {
    icon: Car,
    value: 1200,
    suffix: "+",
    label: "Viajes completados",
    description: "Desde Miraflores, San Isidro, Surco y más",
  },
  {
    icon: TrendingDown,
    value: 45000,
    prefix: "S/ ",
    suffix: "",
    label: "Soles ahorrados",
    description: "Entre todos los usuarios de la plataforma",
  },
];

function AnimatedCounter({
  end,
  duration = 1800,
  prefix = "",
  suffix = "",
}: {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, end, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString("es-PE")}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="py-24" style={{ background: "linear-gradient(135deg, #00BFFF08, #E1EEFF40)" }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <span className="mb-3 inline-block rounded-full bg-white px-4 py-1 text-xs font-semibold text-primary shadow-sm">
            En números
          </span>
          <h2 className="font-heading text-3xl font-bold text-dark sm:text-4xl">
            La comunidad ya está viajando
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-base text-muted-foreground">
            Datos de la plataforma desde el lanzamiento beta.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid gap-6 sm:grid-cols-3">
          {stats.map(({ icon: Icon, value, suffix, prefix, label, description }, i) => (
            <div
              key={label}
              className="card-shadow flex flex-col items-center rounded-xl bg-white p-8 text-center"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface">
                <Icon className="h-6 w-6 text-primary" />
              </div>

              <p className="font-heading text-4xl font-bold text-dark">
                <AnimatedCounter end={value} prefix={prefix} suffix={suffix} />
              </p>
              <p className="mt-1 text-sm font-semibold text-dark">{label}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
