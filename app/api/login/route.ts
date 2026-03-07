import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { LoginSchema } from "@/lib/validators";
import { signSession, setSessionCookie, getClientIp } from "@/lib/auth";

export const runtime = "nodejs";

function noCacheHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0"
  };
}

async function rateLimitOrThrow(key: string) {
  const max = Number(process.env.LOGIN_RATE_MAX || 8);
  const windowSec = Number(process.env.LOGIN_RATE_WINDOW_SECONDS || 10 * 60);
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSec * 1000);

  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing) {
    await prisma.rateLimit.create({ data: { key, count: 1, resetAt } });
    return;
  }

  if (existing.resetAt < now) {
    await prisma.rateLimit.update({
      where: { key },
      data: { count: 1, resetAt }
    });
    return;
  }

  if (existing.count + 1 > max) {
    throw new Error("RATE_LIMIT");
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } }
  });
}

export async function POST(req: Request) {
  const ct = req.headers.get("content-type") || "";
  let email = "";
  let password = "";
  let next = "/admin";

  if (ct.includes("application/json")) {
    const body = await req.json();
    email = String(body.email || "");
    password = String(body.password || "");
    next = String(body.next || "/admin");
  } else {
    const form = await req.formData();
    email = String(form.get("email") || "");
    password = String(form.get("password") || "");
    next = String(form.get("next") || "/admin");
  }

  const ip = getClientIp();
  const key = `login:${ip}`;

  try {
    await rateLimitOrThrow(key);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos. Intenta más tarde." },
      { status: 429, headers: noCacheHeaders() }
    );
  }

  const parsed = LoginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Credenciales inválidas." },
      { status: 400, headers: noCacheHeaders() }
    );
  }

  const admin = await prisma.admin.findUnique({ where: { email: parsed.data.email } });
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Credenciales inválidas." },
      { status: 401, headers: noCacheHeaders() }
    );
  }

  const ok = await bcrypt.compare(parsed.data.password, admin.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Credenciales inválidas." },
      { status: 401, headers: noCacheHeaders() }
    );
  }

  const token = await signSession({ sub: admin.id, email: admin.email });
  setSessionCookie(token);

  if (!ct.includes("application/json")) {
    const baseUrl = process.env.BASE_URL || "https://verifica.cedull.edu.pe";
    const safeNext =
      next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";

    const url = new URL(safeNext, baseUrl);
    return NextResponse.redirect(url, { headers: noCacheHeaders() });
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: noCacheHeaders() });
}