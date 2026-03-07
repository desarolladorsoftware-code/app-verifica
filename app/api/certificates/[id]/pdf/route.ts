import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { qrBuffer } from "@/lib/qr";
import { getSessionTokenFromRequestHeaders, verifySession } from "@/lib/auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

async function requireAuth(req: Request) {
  const token = getSessionTokenFromRequestHeaders(req.headers);
  if (!token) throw new Error("UNAUTH");
  await verifySession(token);
}

function fmtDate(d: Date) {
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

async function readPublicAsset(relativePath: string) {
  const fullPath = path.join(process.cwd(), "public", relativePath);
  return fs.readFile(fullPath);
}

function drawCenteredText(opts: {
  page: any;
  text: string;
  font: any;
  size: number;
  y: number;
  color?: any;
}) {
  const { page, text, font, size, y, color } = opts;
  const width = font.widthOfTextAtSize(text, size);
  const x = (page.getWidth() - width) / 2;
  page.drawText(text, {
    x,
    y,
    size,
    font,
    color: color || rgb(0.12, 0.12, 0.12),
  });
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req);

    const cert = await prisma.certificate.findUnique({
      where: { id: params.id },
    });

    if (!cert) {
      return NextResponse.json(
        { ok: false, error: "No encontrado" },
        { status: 404 }
      );
    }

    const baseUrl = process.env.BASE_URL || "https://verifica.cedull.edu.pe";
    const publicUrl = `${baseUrl.replace(/\/$/, "")}/c/${encodeURIComponent(cert.code)}`;

    const [logoBytes, signatureBytes, qrPng] = await Promise.all([
      readPublicAsset("assets/certificates/logo-cedull.png"),
      readPublicAsset("assets/certificates/firma-director.png"),
      qrBuffer(publicUrl),
    ]);

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(`Certificado ${cert.code}`);
    pdfDoc.setAuthor("CEDULL");
    pdfDoc.setCreator("Sistema de Verificación CEDULL");
    pdfDoc.setProducer("Sistema de Verificación CEDULL");

    const page = pdfDoc.addPage([841.89, 595.28]); // A4 horizontal
    const { width, height } = page.getSize();

    const blue = rgb(15 / 255, 103 / 255, 181 / 255);
    const gold = rgb(231 / 255, 170 / 255, 22 / 255);
    const textDark = rgb(34 / 255, 34 / 255, 34 / 255);
    const textSoft = rgb(51 / 255, 51 / 255, 51 / 255);
    const textBlue = rgb(75 / 255, 111 / 255, 174 / 255);

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const logoImage = await pdfDoc.embedPng(logoBytes);
    const signatureImage = await pdfDoc.embedPng(signatureBytes);
    const qrImage = await pdfDoc.embedPng(qrPng);

    page.drawRectangle({
      x: 0,
      y: height - 172,
      width: 270,
      height: 172,
      color: blue,
    });

    page.drawRectangle({
      x: width - 165,
      y: 0,
      width: 165,
      height: 112,
      color: blue,
    });

    page.drawEllipse({
      x: 120,
      y: height - 40,
      xScale: 155,
      yScale: 120,
      borderColor: gold,
      borderWidth: 7,
    });

    page.drawEllipse({
      x: width - 120,
      y: 40,
      xScale: 170,
      yScale: 120,
      borderColor: gold,
      borderWidth: 7,
    });

    const logoDims = logoImage.scale(0.28);
    page.drawImage(logoImage, {
      x: width - logoDims.width - 48,
      y: height - 95,
      width: logoDims.width,
      height: logoDims.height,
    });

    drawCenteredText({
      page,
      text: 'Corporación de Educación Luis Llerena “CEDULL” otorga el presente',
      font: fontRegular,
      size: 16,
      y: height - 105,
      color: textDark,
    });

    drawCenteredText({
      page,
      text: "CERTIFICADO",
      font: fontRegular,
      size: 40,
      y: height - 165,
      color: textDark,
    });

    drawCenteredText({
      page,
      text: "a:",
      font: fontRegular,
      size: 24,
      y: height - 205,
      color: textDark,
    });

    let nameSize = 24;
    if (cert.fullName.length > 42) nameSize = 20;
    if (cert.fullName.length > 62) nameSize = 18;

    drawCenteredText({
      page,
      text: cert.fullName.toUpperCase(),
      font: fontItalic,
      size: nameSize,
      y: height - 245,
      color: rgb(30 / 255, 30 / 255, 30 / 255),
    });

    const paragraph =
      `por haber aprobado satisfactoriamente el curso ${cert.program}, realizado del ` +
      `${fmtDate(cert.startDate)} al ${fmtDate(cert.endDate)}, con una duración de ` +
      `${cert.hours} horas académicas.`;

    page.drawText(paragraph, {
      x: 90,
      y: height - 320,
      size: 14,
      font: fontRegular,
      color: textSoft,
      maxWidth: width - 180,
      lineHeight: 20,
    });

    page.drawImage(qrImage, {
      x: 55,
      y: 52,
      width: 88,
      height: 88,
    });

    page.drawText(cert.code, {
      x: 50,
      y: 34,
      size: 10,
      font: fontBold,
      color: textBlue,
    });

    const sigDims = signatureImage.scale(0.32);
    const sigX = width / 2 - sigDims.width / 2;
    page.drawImage(signatureImage, {
      x: sigX,
      y: 62,
      width: sigDims.width,
      height: sigDims.height,
    });

    page.drawLine({
      start: { x: width / 2 - 90, y: 58 },
      end: { x: width / 2 + 90, y: 58 },
      thickness: 1,
      color: rgb(0.33, 0.33, 0.33),
    });

    drawCenteredText({
      page,
      text: "JOSE LUIS LLERENA FLORES",
      font: fontBold,
      size: 10,
      y: 42,
      color: textDark,
    });

    drawCenteredText({
      page,
      text: "Director de Formación Continua",
      font: fontRegular,
      size: 9,
      y: 28,
      color: rgb(0.27, 0.27, 0.27),
    });

    page.drawText(`Fecha de Emisión: ${fmtDate(cert.issueDate)}`, {
      x: width - 200,
      y: 42,
      size: 10,
      font: fontRegular,
      color: textBlue,
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${cert.code}.pdf"`,
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

    console.error("PDF route error:", error);

    return NextResponse.json(
      { ok: false, error: "No se pudo generar el PDF" },
      { status: 500 }
    );
  }
}