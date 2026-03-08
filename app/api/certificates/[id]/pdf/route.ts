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

function fmtDateLongEs(d: Date) {
  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  const day = d.getUTCDate();
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} de ${month} de ${year}`;
}

function fmtDateShort(d: Date) {
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

function wrapRichText(opts: {
  segments: Array<{ text: string; bold?: boolean }>;
  regularFont: any;
  boldFont: any;
  size: number;
  maxWidth: number;
}) {
  const { segments, regularFont, boldFont, size, maxWidth } = opts;

  const tokens: Array<{ text: string; bold: boolean }> = [];

  for (const segment of segments) {
    const parts = segment.text.split(" ");
    parts.forEach((part, index) => {
      const token = index === parts.length - 1 ? part : `${part} `;
      if (token) tokens.push({ text: token, bold: !!segment.bold });
    });
  }

  const lines: Array<Array<{ text: string; bold: boolean }>> = [];
  let currentLine: Array<{ text: string; bold: boolean }> = [];
  let currentWidth = 0;

  for (const token of tokens) {
    const font = token.bold ? boldFont : regularFont;
    const tokenWidth = font.widthOfTextAtSize(token.text, size);

    if (currentLine.length === 0 || currentWidth + tokenWidth <= maxWidth) {
      currentLine.push(token);
      currentWidth += tokenWidth;
    } else {
      lines.push(currentLine);
      currentLine = [token];
      currentWidth = tokenWidth;
    }
  }

  if (currentLine.length) lines.push(currentLine);

  return lines;
}

function drawRichCenteredParagraph(opts: {
  page: any;
  y: number;
  size: number;
  maxWidth: number;
  lineHeight: number;
  regularFont: any;
  boldFont: any;
  regularColor: any;
  boldColor: any;
  segments: Array<{ text: string; bold?: boolean }>;
}) {
  const {
    page,
    y,
    size,
    maxWidth,
    lineHeight,
    regularFont,
    boldFont,
    regularColor,
    boldColor,
    segments,
  } = opts;

  const lines = wrapRichText({
    segments,
    regularFont,
    boldFont,
    size,
    maxWidth,
  });

  lines.forEach((line, lineIndex) => {
    const lineWidth = line.reduce((acc, token) => {
      const font = token.bold ? boldFont : regularFont;
      return acc + font.widthOfTextAtSize(token.text, size);
    }, 0);

    let x = (page.getWidth() - lineWidth) / 2;
    const lineY = y - lineIndex * lineHeight;

    for (const token of line) {
      const font = token.bold ? boldFont : regularFont;
      page.drawText(token.text, {
        x,
        y: lineY,
        size,
        font,
        color: token.bold ? boldColor : regularColor,
      });
      x += font.widthOfTextAtSize(token.text, size);
    }
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
    const blue = rgb(6 / 255, 166 / 255, 255 / 255); // #06A6FF
    const orange = rgb(251 / 255, 90 / 255, 0 / 255); // #FB5A00
    const yellow = rgb(243 / 255, 200 / 255, 15 / 255); // #F3C80F
    const white = rgb(1, 1, 1);
    const black = rgb(0, 0, 0);
    const body = rgb(0.20, 0.20, 0.20);

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

    // Borde exterior celeste grueso
    page.drawRectangle({
      x: 10,
      y: 10,
      width: width - 20,
      height: height - 20,
      borderColor: blue,
      borderWidth: 18,
    });

    // Marco interior amarillo grueso
    page.drawRectangle({
      x: 33,
      y: 33,
      width: width - 66,
      height: height - 66,
      borderColor: yellow,
      borderWidth: 5,
    });

    // Logo
    const logoDims = logoImage.scale(0.042);
    page.drawImage(logoImage, {
      x: width - logoDims.width - 52,
      y: height - 62,
      width: logoDims.width,
      height: logoDims.height,
    });

    // Texto institucional
    drawCenteredText({
      page,
      text: 'Corporación de Educación Luis Llerena “CEDULL” otorga el presente',
      font: fontRegular,
      size: 12.8,
      y: height - 92,
      color: black,
    });

    // Título
    drawCenteredText({
      page,
      text: "CERTIFICADO",
      font: fontBold,
      size: 29,
      y: height - 148,
      color: black,
    });

    // Línea naranja
    page.drawRectangle({
      x: width / 2 - 72,
      y: height - 156,
      width: 144,
      height: 2.5,
      color: orange,
    });

    // Subtítulo
    drawCenteredText({
      page,
      text: "Otorgado a:",
      font: fontBold,
      size: 15,
      y: height - 188,
      color: blue,
    });

    // Nombre
    let nameSize = 25;
    if (cert.fullName.length > 30) nameSize = 22;
    if (cert.fullName.length > 42) nameSize = 19;

    drawCenteredText({
      page,
      text: cert.fullName.toUpperCase(),
      font: fontBold,
      size: nameSize,
      y: height - 235,
      color: black,
    });

    // Línea amarilla bajo nombre
    page.drawRectangle({
      x: width / 2 - 145,
      y: height - 244,
      width: 290,
      height: 2.2,
      color: yellow,
    });

    // Párrafo central
    drawRichCenteredParagraph({
      page,
      y: height - 302,
      size: 12.5,
      maxWidth: 575,
      lineHeight: 17,
      regularFont: fontRegular,
      boldFont: fontBold,
      regularColor: body,
      boldColor: body,
      segments: [
        { text: "Por haber aprobado satisfactoriamente el " },
        { text: cert.program, bold: true },
        { text: " con una duración de " },
        { text: `${cert.hours} horas académicas`, bold: true },
        {
          text: `, realizado del ${fmtDateLongEs(cert.startDate)} al ${fmtDateLongEs(
            cert.endDate
          )}, acreditando el desarrollo de nuevas competencias en el área.`,
        },
      ],
    });

    // QR izquierda
    page.drawImage(qrImage, {
      x: 58,
      y: 74,
      width: 58,
      height: 58,
    });

    page.drawText(cert.code, {
      x: 46,
      y: 56,
      size: 8.8,
      font: fontBold,
      color: blue,
    });

    // Firma centro
    const sigDims = signatureImage.scale(0.215);
    const sigX = width / 2 - sigDims.width / 2;

    page.drawImage(signatureImage, {
      x: sigX,
      y: 90,
      width: sigDims.width,
      height: sigDims.height,
    });

    page.drawLine({
      start: { x: width / 2 - 102, y: 82 },
      end: { x: width / 2 + 102, y: 82 },
      thickness: 1,
      color: body,
    });

    drawCenteredText({
      page,
      text: "JOSE LUIS LLERENA FLORES",
      font: fontBold,
      size: 9.8,
      y: 66,
      color: black,
    });

    drawCenteredText({
      page,
      text: "Director de Formación Continua",
      font: fontRegular,
      size: 8.8,
      y: 50,
      color: body,
    });

    // Fecha derecha
    const label = "Fecha de emisión";
    const value = fmtDateShort(cert.issueDate);

    const blockX = width - 144;
    page.drawText(label, {
      x: blockX,
      y: 68,
      size: 8.8,
      font: fontBold,
      color: orange,
    });

    page.drawText(value, {
      x: blockX,
      y: 52,
      size: 13,
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