"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import StepIndicator from "@/components/onboarding/StepIndicator";
import Step1Role from "@/components/onboarding/Step1Role";
import Step2Profile, {
  type ProfileData,
} from "@/components/onboarding/Step2Profile";
import Step3Location, {
  type LocationData,
} from "@/components/onboarding/Step3Location";
import Step4Schedule, {
  type ScheduleData,
  emptySchedule,
  scheduleToRecords,
} from "@/components/onboarding/Step4Schedule";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/supabase/types";

type Step = 1 | 2 | 3 | 4;

const EMPTY_PROFILE: ProfileData = {
  full_name: "",
  gender: "",
  age: "",
  career: "",
  cycle: "",
};

const EMPTY_LOCATION: LocationData = { lat: null, lng: null, address: "" };

function canAdvance(
  step: Step,
  role: UserRole | null,
  profile: ProfileData,
  location: LocationData
): boolean {
  if (step === 1) return role !== null;
  if (step === 2)
    return (
      profile.full_name.trim().length > 0 &&
      profile.gender !== "" &&
      profile.age !== "" &&
      profile.career !== "" &&
      profile.cycle !== ""
    );
  if (step === 3) return location.lat !== null;
  return true;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [location, setLocation] = useState<LocationData>(EMPTY_LOCATION);
  const [schedule, setSchedule] = useState<ScheduleData>(emptySchedule());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Restore state after Google Calendar OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const calParam = params.get("calendar");
    if (!calParam) return;

    const saved = localStorage.getItem("onboarding_save");
    if (saved) {
      try {
        const { role: r, profile: p, location: l } = JSON.parse(saved);
        if (r) setRole(r);
        if (p) setProfile(p);
        if (l) setLocation(l);
        localStorage.removeItem("onboarding_save");
      } catch {
        // ignore parse errors
      }
    }
    setStep(4);
  }, []);

  function handleConnectCalendar() {
    localStorage.setItem(
      "onboarding_save",
      JSON.stringify({ role, profile, location })
    );
    window.location.href = "/api/calendar/connect";
  }

  function next() {
    if (step < 4) setStep((s) => (s + 1) as Step);
  }

  function back() {
    if (step > 1) setStep((s) => (s - 1) as Step);
  }

  async function handleFinish() {
    setError("");
    setLoading(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión expirada. Vuelve a iniciar sesión.");

      // 1 — Upload avatar if provided
      let avatar_url: string | null = null;
      if (profile.avatar) {
        const ext = profile.avatar.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(path, profile.avatar, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(path);
          avatar_url = urlData.publicUrl;
        }
      }

      // 2 — Upsert profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileErr } = await (supabase.from("profiles") as any).upsert({
        id: user.id,
        full_name: profile.full_name.trim(),
        email: user.email!,
        role: role!,
        gender: profile.gender,
        age: parseInt(profile.age, 10),
        career: profile.career,
        cycle: parseInt(profile.cycle, 10),
        avatar_url,
      });
      if (profileErr) throw new Error(profileErr.message);

      // 3 — Upsert home location
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: locErr } = await (supabase.from("locations") as any).upsert(
        {
          user_id: user.id,
          label: "Mi casa",
          lat: location.lat!,
          lng: location.lng!,
          address: location.address,
          is_home: true,
        },
        { onConflict: "user_id" }
      );
      if (locErr) throw new Error(locErr.message);

      // 4 — Insert schedules (skip if none selected)
      const records = scheduleToRecords(schedule);
      if (records.length > 0) {
        await supabase.from("schedules").delete().eq("user_id", user.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: schErr } = await (supabase.from("schedules") as any).insert(
          records.map((r) => ({ ...r, user_id: user.id, is_active: true }))
        );
        if (schErr) throw new Error(schErr.message);
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      setLoading(false);
    }
  }

  const ready = canAdvance(step, role, profile, location);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="UTEC Carpool" width={28} height={28} className="rounded-lg" />
            <span className="hidden font-heading text-base font-bold text-dark sm:block">
              UTEC Carpool
            </span>
          </Link>
          <StepIndicator current={step} />
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-2xl">
          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </motion.div>
          )}

          {/* Step content */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <Step1Role key="step1" value={role} onChange={setRole} />
            )}
            {step === 2 && (
              <Step2Profile
                key="step2"
                value={profile}
                onChange={setProfile}
              />
            )}
            {step === 3 && (
              <Step3Location
                key="step3"
                value={location}
                onChange={setLocation}
                role={role}
              />
            )}
            {step === 4 && (
              <Step4Schedule
                key="step4"
                value={schedule}
                onChange={setSchedule}
                onConnectCalendar={handleConnectCalendar}
              />
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={back}
              disabled={step === 1}
              className="h-12 gap-1.5 px-5 text-sm font-semibold text-dark"
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>

            {step < 4 ? (
              <Button
                type="button"
                onClick={next}
                disabled={!ready}
                className="h-12 gap-2 bg-primary px-8 text-base font-bold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="h-12 gap-2 bg-primary px-8 text-base font-bold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  <>
                    Empezar a viajar
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
