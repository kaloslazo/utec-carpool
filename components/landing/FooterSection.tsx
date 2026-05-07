"use client";

import Link from "next/link";
import Image from "next/image";

export default function FooterSection() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="UTEC Carpool" width={28} height={28} className="rounded-lg" />
            <span className="font-heading text-base font-bold text-dark">
              UTEC Carpool
            </span>
          </Link>

          {/* Links */}
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/auth/register" className="hover:text-primary transition-colors">
              Registrarse
            </Link>
            <Link href="/auth/login" className="hover:text-primary transition-colors">
              Iniciar sesión
            </Link>
          </nav>

          {/* Legal */}
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} UTEC Carpool. Hecho con ♥ en Lima.
          </p>
        </div>
      </div>
    </footer>
  );
}
