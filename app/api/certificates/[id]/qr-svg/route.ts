import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { qrSvg } from "@/lib/qr";
import { getSessionTokenFromRequestHeaders, verifySession } from "@/lib/auth";

export const runtime = "nodejs";

async function requireAuth(req: Request) {
  const token = getSessionTokenFromRequestHeaders(req.headers);
  if (!token) throw new Error("UNAUTH");
  await verifySession(token);
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req);

    const cert = await prisma.certificate.findUnique({
      where: { id: params.id },
      select: { id: true, code: true },
    });

    if (!cert) {
      return NextResponse.json(
        { ok: false, error: "No encontrado" },
        { status: 404 }
      );
    }

    const baseUrl = process.env.BASE_URL || "https://verifica.cedull.edu.pe";
    const publicUrl = `${baseUrl.replace(/\/$/, "")}/c/${encodeURIComponent(cert.code)}`;
    const svg = await qrSvg(publicUrl);

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${cert.code}.svg"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ERROR";

    if (message === "UNAUTH") {
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    console.error("QR SVG route error:", error);

    return NextResponse.json(
      { ok: false, error: "No se pudo generar el QR SVG" },
      { status: 500 }
    );
  }
}