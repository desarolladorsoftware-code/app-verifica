import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CertificateCreateSchema } from "@/lib/validators";
import { generateUniqueCode } from "@/lib/code";
import { getSessionTokenFromRequestHeaders, verifySession } from "@/lib/auth";

export const runtime = "nodejs";

async function requireAuth(req: Request) {
  const token = getSessionTokenFromRequestHeaders(req.headers);
  if (!token) throw new Error("UNAUTH");
  await verifySession(token);
}

function noStore() {
  return {
    "Cache-Control": "no-store"
  };
}

export async function GET(req: Request) {
  try {
    await requireAuth(req);
    const items = await prisma.certificate.findMany({
      orderBy: { createdAt: "desc" },
      take: 500
    });
    return NextResponse.json({ ok: true, items }, { headers: noStore() });
  } catch {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401, headers: noStore() });
  }
}

export async function POST(req: Request) {
  // Soporta form POST desde /admin/new y JSON
  try {
    await requireAuth(req);
  } catch {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401, headers: noStore() });
  }

  const ct = req.headers.get("content-type") || "";
  let payload: any = {};

  if (ct.includes("application/json")) {
    payload = await req.json();
  } else {
    const form = await req.formData();
    payload = {
      fullName: String(form.get("fullName") || ""),
      documentId: String(form.get("documentId") || "") || null,
      program: String(form.get("program") || ""),
      startDate: String(form.get("startDate") || ""),
      endDate: String(form.get("endDate") || ""),
      hours: Number(form.get("hours") || 0),
      institution: String(form.get("institution") || ""),
      authority: String(form.get("authority") || ""),
      issueDate: String(form.get("issueDate") || ""),
      observations: String(form.get("observations") || "") || null
    };
  }

  const parsed = CertificateCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400, headers: noStore() });
  }

  const code = await generateUniqueCode(process.env.CODE_PREFIX || "CEDULL");

  const cert = await prisma.certificate.create({
    data: {
      code,
      fullName: parsed.data.fullName,
      documentId: parsed.data.documentId || null,
      program: parsed.data.program,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      hours: parsed.data.hours,
      institution: parsed.data.institution,
      authority: parsed.data.authority,
      issueDate: new Date(parsed.data.issueDate),
      observations: parsed.data.observations || null
    }
  });

  // Si venía por form, redirige a detalle
  if (!ct.includes("application/json")) {
    const url = new URL(`/admin/${cert.id}`, req.url);
    return NextResponse.redirect(url, { headers: noStore() });
  }

  return NextResponse.json({ ok: true, cert }, { status: 201, headers: noStore() });
}