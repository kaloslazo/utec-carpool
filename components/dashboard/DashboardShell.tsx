"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, Plus, User, LogOut, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/supabase/types";

interface ShellProfile {
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
}

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home,   label: "Inicio",         roles: ["passenger", "driver", "both"] as UserRole[] },
  { href: "/buscar",    icon: Search, label: "Buscar viaje",   roles: ["passenger", "both"] as UserRole[] },
  { href: "/publicar",  icon: Plus,   label: "Publicar viaje", roles: ["driver", "both"] as UserRole[] },
  { href: "/viajes",    icon: Car,    label: "Mis viajes",     roles: ["passenger", "driver", "both"] as UserRole[] },
  { href: "/perfil",    icon: User,   label: "Mi perfil",      roles: ["passenger", "driver", "both"] as UserRole[] },
];

const ROLE_LABEL: Record<UserRole, string> = {
  passenger: "Pasajero",
  driver: "Conductor",
  both: "Conductor · Pasajero",
};

export default function DashboardShell({ profile, children }: { profile: ShellProfile; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(profile.role));
  const initial = profile.full_name[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex min-h-screen bg-[#f0f4f9]">

      {/* ── Dark sidebar — desktop ── */}
      <aside className="hidden w-[220px] shrink-0 flex-col lg:flex" style={{ background: "#0f1c2e" }}>

        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 px-5">
          <Image src="/logo.png" alt="UTEC Carpool" width={28} height={28} className="rounded-lg" />
          <span className="font-heading text-sm font-bold text-white">UTEC Carpool</span>
        </div>

        {/* User card */}
        <div className="mx-3 mb-2 rounded-xl px-3 py-3" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ background: "rgba(0,191,255,0.15)", outline: "2px solid rgba(0,191,255,0.25)" }}>
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-heading text-sm font-bold text-[#00BFFF]">{initial}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white/90">{profile.full_name}</p>
              <p className="text-[10px] text-white/45">{ROLE_LABEL[profile.role]}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-3">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "text-[#00BFFF]"
                    : "text-white/50 hover:text-white/85"
                )}
                style={active ? { background: "rgba(0,191,255,0.12)" } : undefined}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[#00BFFF]" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/35 transition-all hover:text-red-400"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Mobile top bar */}
        <header className="flex h-14 items-center justify-between bg-white px-4 lg:hidden" style={{ boxShadow: "0 1px 0 0 #e2e8f0" }}>
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="UTEC Carpool" width={24} height={24} className="rounded-lg" />
            <span className="font-heading text-sm font-bold text-dark">UTEC Carpool</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/10 ring-2 ring-primary/20">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-primary">{initial}</span>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 sm:px-6 lg:pb-8">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-50 flex bg-white/90 backdrop-blur-md lg:hidden" style={{ boxShadow: "0 -1px 0 0 #e2e8f0" }}>
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className={cn("flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold", active ? "text-primary" : "text-muted-foreground")}>
                <div className={cn("flex h-6 w-6 items-center justify-center rounded-lg transition-all", active ? "bg-primary/15" : "")}>
                  <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                </div>
                {label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
