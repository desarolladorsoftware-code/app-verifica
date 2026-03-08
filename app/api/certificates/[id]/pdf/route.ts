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
    const pieces = segment.text.split(" ");
    pieces.forEach((piece, index) => {
      const token = index === pieces.length - 1 ? piece : `${piece} `;
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
    const publicUrl = `${baseUrl.replace(/\/$/, "")}/c/${encodeURIComponent(
      cert.code
    )}`;

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
    const blue = rgb(6 / 255, 166 / 255, 255 / 255);      // #06A6FF
    const orange = rgb(251 / 255, 90 / 255, 0 / 255);     // #FB5A00
    const yellow = rgb(243 / 255, 200 / 255, 15 / 255);   // #F3C80F
    const white = rgb(1, 1, 1);                           // #FFFFFF
    const black = rgb(0, 0, 0);                           // #000000
    const textGray = rgb(0.22, 0.22, 0.22);

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

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

    // Borde exterior celeste
    page.drawRectangle({
      x: 8,
      y: 8,
      width: width - 16,
      height: height - 16,
      borderColor: blue,
      borderWidth: 4,
      color: white,
    });

    // Marco interior dorado
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: yellow,
      borderWidth: 1.4,
    });

    // Remates superiores
    page.drawRectangle({
      x: 20,
      y: height - 16,
      width: 70,
      height: 3,
      color: blue,
    });

    page.drawRectangle({
      x: width - 90,
      y: height - 16,
      width: 70,
      height: 3,
      color: orange,
    });

    // Remates inferiores
    page.drawRectangle({
      x: 20,
      y: 13,
      width: 70,
      height: 3,
      color: yellow,
    });

    page.drawRectangle({
      x: width - 90,
      y: 13,
      width: 70,
      height: 3,
      color: blue,
    });

    // Logo superior derecha
    const logoDims = logoImage.scale(0.043);
    page.drawImage(logoImage, {
      x: width - logoDims.width - 34,
      y: height - 62,
      width: logoDims.width,
      height: logoDims.height,
    });

    // Texto institucional
    drawCenteredText({
      page,
      text: 'Corporación de Educación Luis Llerena “CEDULL” otorga el presente',
      font: fontRegular,
      size: 13.5,
      y: height - 88,
      color: black,
    });

    // Título
    drawCenteredText({
      page,
      text: "CERTIFICADO",
      font: fontTitle,
      size: 30,
      y: height - 145,
      color: black,
    });

    // Línea naranja bajo título
    page.drawRectangle({
      x: width / 2 - 78,
      y: height - 154,
      width: 156,
      height: 2.2,
      color: orange,
    });

    // Subtítulo
    drawCenteredText({
      page,
      text: "Otorgado a:",
      font: fontBold,
      size: 15,
      y: height - 186,
      color: blue,
    });

    // Nombre
    let nameSize = 27;
    if (cert.fullName.length > 28) nameSize = 24;
    if (cert.fullName.length > 40) nameSize = 21;

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
      x: width / 2 - 150,
      y: height - 246,
      width: 300,
      height: 2,
      color: yellow,
    });

    // Texto descriptivo
    drawRichCenteredParagraph({
      page,
      y: height - 300,
      size: 13.4,
      maxWidth: 640,
      lineHeight: 19,
      regularFont: fontRegular,
      boldFont: fontBold,
      regularColor: textGray,
      boldColor: textGray,
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

    // QR abajo izquierda
    page.drawImage(qrImage, {
      x: 28,
      y: 88,
      width: 64,
      height: 64,
    });

    page.drawText(cert.code, {
      x: 16,
      y: 70,
      size: 9.5,
      font: fontBold,
      color: blue,
    });

    // Firma al centro
    const sigDims = signatureImage.scale(0.23);
    const sigX = width / 2 - sigDims.width / 2;

    page.drawImage(signatureImage, {
      x: sigX,
      y: 106,
      width: sigDims.width,
      height: sigDims.height,
    });

    page.drawLine({
      start: { x: width / 2 - 110, y: 98 },
      end: { x: width / 2 + 110, y: 98 },
      thickness: 1,
      color: textGray,
    });

    drawCenteredText({
      page,
      text: "JOSE LUIS LLERENA FLORES",
      font: fontBold,
      size: 10,
      y: 80,
      color: black,
    });

    drawCenteredText({
      page,
      text: "Director de Formación Continua",
      font: fontRegular,
      size: 9.2,
      y: 64,
      color: textGray,
    });

    // Fecha abajo derecha
    const dateLabel = "Fecha de emisión";
    const dateValue = fmtDateLongEs(cert.issueDate);

    const labelWidth = fontBold.widthOfTextAtSize(dateLabel, 9.2);
    const valueWidth = fontBold.widthOfTextAtSize(dateValue, 12);
    const blockWidth = Math.max(labelWidth, valueWidth);
    const rightMargin = 28;
    const blockX = width - rightMargin - blockWidth;

    page.drawText(dateLabel, {
      x: blockX,
      y: 82,
      size: 9.2,
      font: fontBold,
      color: orange,
    });

    page.drawText(dateValue, {
      x: blockX,
      y: 64,
      size: 12,
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