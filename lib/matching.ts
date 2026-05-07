import { createClient } from "@/lib/supabase/client";
import { UTEC_LAT, UTEC_LNG, MATCH_TIME_WINDOW_MINUTES } from "@/lib/constants";

interface TripWithJoins {
  id: string;
  available_seats: number;
  estimated_price_soles: number;
  schedule_id: string;
  driver_id: string;
  schedules: {
    day_of_week: number;
    departure_time: string;
    direction: string;
  } | null;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    career: string;
    cycle: number;
  } | null;
  driver_profiles: {
    plate: string;
    car_brand: string;
    car_model: string;
    car_color: string;
    yape_qr_url: string | null;
    is_verified: boolean;
    search_radius_km: number;
  } | null;
}

interface LocationRow {
  lat: number;
  lng: number;
}

interface ScheduleWithProfile {
  day_of_week: number;
  departure_time: string;
  direction: string;
  profiles: { career: string; cycle: number } | null;
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export interface MatchResult {
  driver: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    career: string;
    cycle: number;
    plate: string;
    car_brand: string;
    car_model: string;
    car_color: string;
    yape_qr_url: string | null;
    is_verified: boolean;
    search_radius_km: number;
  };
  trip: {
    id: string;
    available_seats: number;
    estimated_price_soles: number;
    departure_time: string;
  };
  deviationKm: number;
  timeMatch: number;
  affinityScore: number;
}

export async function findMatches(
  passengerId: string,
  scheduleId: string
): Promise<MatchResult[]> {
  const supabase = createClient();

  const { data: passengerSchedule } = await supabase
    .from("schedules")
    .select("*, profiles!user_id(career, cycle)")
    .eq("id", scheduleId)
    .single() as { data: ScheduleWithProfile | null; error: unknown };

  if (!passengerSchedule) return [];

  const { data: passengerLocation } = await supabase
    .from("locations")
    .select("lat, lng")
    .eq("user_id", passengerId)
    .eq("is_home", true)
    .single() as { data: LocationRow | null; error: unknown };

  if (!passengerLocation) return [];

  const passengerMinutes = timeToMinutes(passengerSchedule.departure_time);
  const windowStart = passengerMinutes - MATCH_TIME_WINDOW_MINUTES;
  const windowEnd = passengerMinutes + MATCH_TIME_WINDOW_MINUTES;

  const { data: candidateTrips } = await supabase
    .from("trips")
    .select(
      `
      id,
      available_seats,
      estimated_price_soles,
      schedule_id,
      driver_id,
      schedules!schedule_id(day_of_week, departure_time, direction),
      profiles!driver_id(
        id, full_name, avatar_url, career, cycle
      ),
      driver_profiles!driver_id(
        plate, car_brand, car_model, car_color,
        yape_qr_url, is_verified, search_radius_km
      )
    `
    )
    .eq("status", "open")
    .gt("available_seats", 0) as { data: TripWithJoins[] | null; error: unknown };

  if (!candidateTrips) return [];

  const passengerCareer = passengerSchedule.profiles?.career;
  const passengerCycle = passengerSchedule.profiles?.cycle;

  const results: MatchResult[] = [];

  for (const trip of candidateTrips) {
    const schedule = trip.schedules;
    if (!schedule) continue;
    if (schedule.day_of_week !== passengerSchedule.day_of_week) continue;
    if (schedule.direction !== passengerSchedule.direction) continue;

    const driverMinutes = timeToMinutes(schedule.departure_time);
    if (driverMinutes < windowStart || driverMinutes > windowEnd) continue;

    const driverProfile = trip.profiles;
    const driverExtraProfile = trip.driver_profiles;
    if (!driverProfile || !driverExtraProfile) continue;

    const { data: driverLocation } = await supabase
      .from("locations")
      .select("lat, lng")
      .eq("user_id", trip.driver_id)
      .eq("is_home", true)
      .single() as { data: LocationRow | null; error: unknown };

    if (!driverLocation) continue;

    const pickupToDriver = haversineKm(
      passengerLocation.lat,
      passengerLocation.lng,
      driverLocation.lat,
      driverLocation.lng
    );

    if (pickupToDriver > driverExtraProfile.search_radius_km) continue;

    const directRouteKm = haversineKm(
      driverLocation.lat,
      driverLocation.lng,
      UTEC_LAT,
      UTEC_LNG
    );
    const withPickupKm =
      pickupToDriver +
      haversineKm(
        passengerLocation.lat,
        passengerLocation.lng,
        UTEC_LAT,
        UTEC_LNG
      );
    const deviationKm = Math.max(0, withPickupKm - directRouteKm);

    const timeDiff = Math.abs(driverMinutes - passengerMinutes);
    const timeMatch = 1 - timeDiff / MATCH_TIME_WINDOW_MINUTES;

    let affinityScore = 0;
    if (driverProfile.career === passengerCareer) affinityScore += 0.5;
    if (driverProfile.cycle === passengerCycle) affinityScore += 0.5;

    results.push({
      driver: {
        id: driverProfile.id,
        full_name: driverProfile.full_name,
        avatar_url: driverProfile.avatar_url,
        career: driverProfile.career,
        cycle: driverProfile.cycle,
        plate: driverExtraProfile.plate,
        car_brand: driverExtraProfile.car_brand,
        car_model: driverExtraProfile.car_model,
        car_color: driverExtraProfile.car_color,
        yape_qr_url: driverExtraProfile.yape_qr_url,
        is_verified: driverExtraProfile.is_verified,
        search_radius_km: driverExtraProfile.search_radius_km,
      },
      trip: {
        id: trip.id,
        available_seats: trip.available_seats,
        estimated_price_soles: trip.estimated_price_soles,
        departure_time: schedule.departure_time,
      },
      deviationKm,
      timeMatch,
      affinityScore,
    });
  }

  return results.sort(
    (a, b) =>
      a.deviationKm - b.deviationKm ||
      b.timeMatch - a.timeMatch ||
      b.affinityScore - a.affinityScore
  );
}
