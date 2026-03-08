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
    color: color || rgb(0, 0, 0),
  });
}

function drawWrappedCenteredText(opts: {
  page: any;
  text: string;
  font: any;
  size: number;
  y: number;
  maxWidth: number;
  lineHeight: number;
  color?: any;
}) {
  const { page, text, font, size, y, maxWidth, lineHeight, color } = opts;

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, size);

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);

  lines.forEach((line, index) => {
    const lineWidth = font.widthOfTextAtSize(line, size);
    const x = (page.getWidth() - lineWidth) / 2;
    page.drawText(line, {
      x,
      y: y - index * lineHeight,
      size,
      font,
      color: color || rgb(0, 0, 0),
    });
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

    // Colores corporativos
    const primaryBlue = rgb(6 / 255, 166 / 255, 255 / 255);   // #06A6FF
    const orange = rgb(251 / 255, 90 / 255, 0 / 255);         // #FB5A00
    const yellow = rgb(243 / 255, 200 / 255, 15 / 255);       // #F3C80F
    const black = rgb(0, 0, 0);                               // #000000
    const white = rgb(1, 1, 1);                               // #FFFFFF
    const softGray = rgb(0.35, 0.35, 0.35);

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const logoImage = await pdfDoc.embedPng(logoBytes);
    const signatureImage = await pdfDoc.embedPng(signatureBytes);
    const qrImage = await pdfDoc.embedPng(qrPng);

    // Fondo blanco
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: white,
    });

    // Marco exterior
    page.drawRectangle({
      x: 16,
      y: 16,
      width: width - 32,
      height: height - 32,
      borderColor: primaryBlue,
      borderWidth: 4,
      color: white,
    });

    // Marco interior
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: yellow,
      borderWidth: 1.5,
    });

    // Acentos decorativos sutiles
    page.drawRectangle({
      x: 30,
      y: height - 36,
      width: 140,
      height: 4,
      color: orange,
    });

    page.drawRectangle({
      x: width - 170,
      y: height - 36,
      width: 140,
      height: 4,
      color: yellow,
    });

    page.drawRectangle({
      x: 30,
      y: 32,
      width: 140,
      height: 4,
      color: yellow,
    });

    page.drawRectangle({
      x: width - 170,
      y: 32,
      width: 140,
      height: 4,
      color: primaryBlue,
    });

    // Esquinas
    page.drawLine({
      start: { x: 30, y: height - 30 },
      end: { x: 30, y: height - 85 },
      thickness: 3,
      color: primaryBlue,
    });
    page.drawLine({
      start: { x: 30, y: height - 30 },
      end: { x: 85, y: height - 30 },
      thickness: 3,
      color: primaryBlue,
    });

    page.drawLine({
      start: { x: width - 30, y: height - 30 },
      end: { x: width - 30, y: height - 85 },
      thickness: 3,
      color: orange,
    });
    page.drawLine({
      start: { x: width - 30, y: height - 30 },
      end: { x: width - 85, y: height - 30 },
      thickness: 3,
      color: orange,
    });

    page.drawLine({
      start: { x: 30, y: 30 },
      end: { x: 30, y: 85 },
      thickness: 3,
      color: yellow,
    });
    page.drawLine({
      start: { x: 30, y: 30 },
      end: { x: 85, y: 30 },
      thickness: 3,
      color: yellow,
    });

    page.drawLine({
      start: { x: width - 30, y: 30 },
      end: { x: width - 30, y: 85 },
      thickness: 3,
      color: primaryBlue,
    });
    page.drawLine({
      start: { x: width - 30, y: 30 },
      end: { x: width - 85, y: 30 },
      thickness: 3,
      color: primaryBlue,
    });

    // Logo arriba derecha
    const logoDims = logoImage.scale(0.05);
    page.drawImage(logoImage, {
      x: width - logoDims.width - 52,
      y: height - 88,
      width: logoDims.width,
      height: logoDims.height,
    });

    // Texto institucional
    drawCenteredText({
      page,
      text: 'Corporación de Educación Luis Llerena “CEDULL” otorga el presente',
      font: fontRegular,
      size: 15,
      y: height - 120,
      color: black,
    });

    // Título
    drawCenteredText({
      page,
      text: "CERTIFICADO",
      font: fontBold,
      size: 34,
      y: height - 175,
      color: black,
    });

    // Línea decorativa bajo título
    page.drawRectangle({
      x: width / 2 - 70,
      y: height - 185,
      width: 140,
      height: 3,
      color: orange,
    });

    // Subtítulo
    drawCenteredText({
      page,
      text: "Otorgado a:",
      font: fontBold,
      size: 16,
      y: height - 215,
      color: primaryBlue,
    });

    // Nombre
    let nameSize = 26;
    if (cert.fullName.length > 34) nameSize = 22;
    if (cert.fullName.length > 48) nameSize = 19;

    drawCenteredText({
      page,
      text: cert.fullName.toUpperCase(),
      font: fontBold,
      size: nameSize,
      y: height - 255,
      color: black,
    });

    // Línea bajo nombre
    page.drawRectangle({
      x: width / 2 - 150,
      y: height - 265,
      width: 300,
      height: 1.8,
      color: yellow,
    });

    // Texto descriptivo centrado
    const paragraph =
      `Por haber aprobado satisfactoriamente el curso ${cert.program}, realizado del ` +
      `${fmtDate(cert.startDate)} al ${fmtDate(cert.endDate)}, con una duración de ` +
      `${cert.hours} horas académicas.`;

    drawWrappedCenteredText({
      page,
      text: paragraph,
      font: fontRegular,
      size: 14,
      y: height - 320,
      maxWidth: 620,
      lineHeight: 20,
      color: black,
    });

    // QR abajo izquierda
    page.drawRectangle({
      x: 58,
      y: 58,
      width: 84,
      height: 84,
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 1,
      color: white,
    });

    page.drawImage(qrImage, {
      x: 62,
      y: 62,
      width: 76,
      height: 76,
    });

    page.drawText(cert.code, {
      x: 50,
      y: 40,
      size: 9,
      font: fontBold,
      color: primaryBlue,
    });

    // Firma al centro
    const sigDims = signatureImage.scale(0.28);
    const sigX = width / 2 - sigDims.width / 2;

    page.drawImage(signatureImage, {
      x: sigX,
      y: 70,
      width: sigDims.width,
      height: sigDims.height,
    });

    page.drawLine({
      start: { x: width / 2 - 110, y: 66 },
      end: { x: width / 2 + 110, y: 66 },
      thickness: 1,
      color: black,
    });

    drawCenteredText({
      page,
      text: "JOSE LUIS LLERENA FLORES",
      font: fontBold,
      size: 10.5,
      y: 48,
      color: black,
    });

    drawCenteredText({
      page,
      text: "Director de Formación Continua",
      font: fontRegular,
      size: 9.5,
      y: 34,
      color: softGray,
    });

    // Fecha abajo derecha
    page.drawText("Fecha de emisión", {
      x: width - 155,
      y: 54,
      size: 9,
      font: fontBold,
      color: orange,
    });

    page.drawText(fmtDate(cert.issueDate), {
      x: width - 155,
      y: 36,
      size: 14,
      font: fontBold,
      color: black,
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