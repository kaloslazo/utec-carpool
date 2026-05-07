import { type NextRequest, NextResponse } from "next/server";
import {
  exchangeCode,
  fetchCalendarEvents,
  parseEventsToSchedule,
} from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const { searchParams, protocol, host } = request.nextUrl;
  const code = searchParams.get("code");
  const base = process.env.NEXTAUTH_URL ?? `${protocol}//${host}`;

  const failUrl = new URL("/onboarding?calendar=error", base);
  if (!code) return NextResponse.redirect(failUrl);

  try {
    const tokens = await exchangeCode(code);
    if (tokens.error || !tokens.access_token) {
      return NextResponse.redirect(failUrl);
    }

    const events = await fetchCalendarEvents(tokens.access_token);
    const schedule = parseEventsToSchedule(events);

    const successUrl = new URL("/onboarding?calendar=1", base);
    const res = NextResponse.redirect(successUrl);

    res.cookies.set("calendar_import", JSON.stringify(schedule), {
      maxAge: 60 * 10,
      httpOnly: false,
      path: "/",
      sameSite: "lax",
    });

    return res;
  } catch (err) {
    console.error("[calendar/callback]", err);
    return NextResponse.redirect(failUrl);
  }
}
