import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
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

    const pngBuffer = await QRCode.toBuffer(publicUrl, {
      type: "png",
      width: 1000,
      margin: 2,
      errorCorrectionLevel: "H",
    });

    return new NextResponse(pngBuffer as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${cert.code}.png"`,
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

    console.error("QR route error:", error);

    return NextResponse.json(
      { ok: false, error: "No se pudo generar el QR" },
      { status: 500 }
    );
  }
}