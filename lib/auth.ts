import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";

const COOKIE_NAME = "session";

function secretKey() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET debe existir y tener >= 32 caracteres");
  }
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  sub: string;      // admin id
  email: string;
};

export async function signSession(payload: SessionPayload) {
  const ttlSeconds = Number(process.env.SESSION_TTL_SECONDS || 60 * 60 * 12); // 12h
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttlSeconds;

  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(secretKey());
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, secretKey(), {
    algorithms: ["HS256"]
  });
  const sub = payload.sub;
  const email = payload.email;

  if (!sub || typeof sub !== "string") throw new Error("JWT inválido (sub)");
  if (!email || typeof email !== "string") throw new Error("JWT inválido (email)");
  return { sub, email };
}

export function setSessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production";
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Number(process.env.SESSION_TTL_SECONDS || 60 * 60 * 12)
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export function getSessionTokenFromRequestHeaders(reqHeaders: Headers) {
  const cookie = reqHeaders.get("cookie") || "";
  const parts = cookie.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(COOKIE_NAME + "=")) return decodeURIComponent(p.slice((COOKIE_NAME + "=").length));
  }
  return null;
}

export function getClientIp() {
  const h = headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const xrip = h.get("x-real-ip");
  if (xrip) return xrip.trim();
  return "unknown";
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;