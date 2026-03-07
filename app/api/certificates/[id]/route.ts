import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CertificateUpdateSchema } from "@/lib/validators";
import { getSessionTokenFromRequestHeaders, verifySession } from "@/lib/auth";

export const runtime = "nodejs";

async function requireAuth(req: Request) {
  const token = getSessionTokenFromRequestHeaders(req.headers);
  if (!token) throw new Error("UNAUTH");
  await verifySession(token);
}

function noStore() {
  return { "Cache-Control": "no-store" };
}

function toUtcMidnight(dateStr: string) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);

    const cert = await prisma.certificate.findUnique({
      where: { id: params.id },
    });

    if (!cert) {
      return NextResponse.json(
        { ok: false, error: "No encontrado" },
        { status: 404, headers: noStore() }
      );
    }

    return NextResponse.json({ ok: true, cert }, { headers: noStore() });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 401, headers: noStore() }
    );
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);

    const body = await req.json();
    const parsed = CertificateUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400, headers: noStore() }
      );
    }

    const cert = await prisma.certificate.update({
      where: { id: params.id },
      data: {
        fullName: parsed.data.fullName,
        documentId: parsed.data.documentId || null,
        program: parsed.data.program,
        startDate: toUtcMidnight(parsed.data.startDate),
        endDate: toUtcMidnight(parsed.data.endDate),
        hours: parsed.data.hours,
        institution: parsed.data.institution,
        authority: parsed.data.authority,
        issueDate: toUtcMidnight(parsed.data.issueDate),
        observations: parsed.data.observations || null,
        status: parsed.data.status as any,
      },
    });

    return NextResponse.json({ ok: true, cert }, { headers: noStore() });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 401, headers: noStore() }
    );
  }
}

// DELETE = Revocar (no borrar)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req);

    await prisma.certificate.update({
      where: { id: params.id },
      data: { status: "REVOCADO" },
    });

    return NextResponse.json({ ok: true }, { headers: noStore() });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 401, headers: noStore() }
    );
  }
}

// Para soportar form POST con _method=DELETE desde el detalle
export async function POST(req: Request, ctx: any) {
  const form = await req.formData();
  const method = String(form.get("_method") || "").toUpperCase();

  if (method === "DELETE") {
    return DELETE(req, ctx);
  }

  return NextResponse.json(
    { ok: false, error: "Método no soportado" },
    { status: 405, headers: noStore() }
  );
}