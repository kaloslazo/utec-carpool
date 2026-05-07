const START_HOUR = 6;
const TOTAL_SLOTS = 32; // 06:00 → 21:30, every 30 min

export interface CalendarSchedule {
  to_utec: boolean[][];
  from_utec: boolean[][];
}

function emptyGrid(): boolean[][] {
  return Array.from({ length: 6 }, () => Array(TOTAL_SLOTS).fill(false));
}

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/calendar/callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events.readonly",
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCode(
  code: string
): Promise<{ access_token: string; error?: string }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/calendar/callback`,
      grant_type: "authorization_code",
    }),
  });
  return res.json();
}

interface GoogleEvent {
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  status?: string;
}

export async function fetchCalendarEvents(
  accessToken: string
): Promise<GoogleEvent[]> {
  const now = new Date();
  const twoWeeksOut = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: twoWeeksOut.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "200",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();
  return (data.items ?? []).filter(
    (e: GoogleEvent) => e.status !== "cancelled"
  );
}

// Extract local time components directly from ISO string to avoid
// server timezone issues (Peru is UTC-5 but server may be UTC).
function parseIsoLocal(
  isoStr: string
): { datePart: string; hours: number; minutes: number } | null {
  // e.g. "2026-05-11T07:30:00-05:00"
  const tIdx = isoStr.indexOf("T");
  if (tIdx === -1) return null; // all-day event
  const datePart = isoStr.substring(0, tIdx);
  const timePart = isoStr.substring(tIdx + 1, tIdx + 6); // "07:30"
  const [h, m] = timePart.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return { datePart, hours: h, minutes: m };
}

function dateToDayOfWeek(datePart: string): number {
  // Parse YYYY-MM-DD as UTC midnight so no timezone shift affects the day.
  const [y, mo, d] = datePart.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay(); // 0=Sun…6=Sat
}

function minutesToSlotIndex(minutes: number): number | null {
  const startMin = START_HOUR * 60;
  const endMin = startMin + TOTAL_SLOTS * 30;
  if (minutes < startMin || minutes >= endMin) return null;
  return Math.round((minutes - startMin) / 30);
}

export function parseEventsToSchedule(
  events: GoogleEvent[]
): CalendarSchedule {
  const to_utec = emptyGrid();
  const from_utec = emptyGrid();
  const seen = new Set<string>();

  for (const event of events) {
    const startIso = event.start.dateTime;
    const endIso = event.end?.dateTime;
    if (!startIso) continue; // skip all-day events

    const start = parseIsoLocal(startIso);
    if (!start) continue;

    const jsDay = dateToDayOfWeek(start.datePart);
    if (jsDay === 0) continue; // skip Sunday (not in grid)
    const gridDay = jsDay - 1; // Mon=0 … Sat=5

    const startMin = start.hours * 60 + start.minutes;

    if (startMin < 13 * 60) {
      // Morning → going to UTEC
      const slotIdx = minutesToSlotIndex(startMin);
      const key = `to-${gridDay}-${slotIdx}`;
      if (slotIdx !== null && !seen.has(key)) {
        seen.add(key);
        to_utec[gridDay][slotIdx] = true;
      }
    } else {
      // Afternoon/evening → leaving UTEC
      let depMin = startMin;
      if (endIso) {
        const end = parseIsoLocal(endIso);
        if (end) depMin = end.hours * 60 + end.minutes;
      }
      const slotIdx = minutesToSlotIndex(depMin);
      const key = `from-${gridDay}-${slotIdx}`;
      if (slotIdx !== null && !seen.has(key)) {
        seen.add(key);
        from_utec[gridDay][slotIdx] = true;
      }
    }
  }

  return { to_utec, from_utec };
}

export function countSlots(schedule: CalendarSchedule): number {
  return (
    schedule.to_utec.flat().filter(Boolean).length +
    schedule.from_utec.flat().filter(Boolean).length
  );
}
