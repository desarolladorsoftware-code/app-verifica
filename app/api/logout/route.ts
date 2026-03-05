import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  clearSessionCookie();
  const url = new URL("/admin/login", req.url);
  return NextResponse.redirect(url, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}