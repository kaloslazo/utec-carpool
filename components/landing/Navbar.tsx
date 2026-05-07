"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="UTEC Carpool" width={32} height={32} className="rounded-lg" />
          <span className="font-heading text-lg font-bold text-dark">
            UTEC Carpool
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm" className="text-dark">
              Iniciar sesión
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button
              size="sm"
              className="bg-primary px-4 text-white hover:bg-primary/90"
            >
              Registrarse
            </Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
