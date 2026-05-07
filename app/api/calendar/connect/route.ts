import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-calendar";

export function GET() {
  return NextResponse.redirect(getGoogleAuthUrl());
}
