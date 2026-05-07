import Link from "next/link";
import Image from "next/image";
import { Shield, MapPin, Users } from "lucide-react";

const features = [
  {
    icon: Shield,
    text: "Solo estudiantes verificados con email @utec.edu.pe",
  },
  {
    icon: MapPin,
    text: "Mapas en tiempo real con OpenStreetMap",
  },
  {
    icon: Users,
    text: "Coordina viajes y paga directo con Yape",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left — brand panel */}
      <div
        className="relative hidden flex-col justify-between p-12 lg:flex lg:w-[45%]"
        style={{ background: "linear-gradient(145deg, #00BFFF 0%, #0090cc 60%, #E1EEFF 100%)" }}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-80 w-80 rounded-full bg-white/5" />

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-2.5">
          <Image src="/logo.png" alt="UTEC Carpool" width={36} height={36} className="rounded-xl" />
          <span className="font-heading text-xl font-bold text-white">
            UTEC Carpool
          </span>
        </Link>

        {/* Center content */}
        <div className="relative">
          <h2 className="mb-2 font-heading text-3xl font-bold leading-tight text-white">
            Viaja con alguien de tu universidad
          </h2>
          <p className="mb-8 text-sm text-white/70">
            La plataforma de carpooling hecha exclusivamente para estudiantes de
            UTEC Barranco.
          </p>

          <ul className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm text-white/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom */}
        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} UTEC Carpool
        </p>
      </div>

      {/* Right — form area */}
      <div className="flex flex-1 items-center justify-center bg-white px-4 py-12 sm:px-8">
        {children}
      </div>
    </div>
  );
}
