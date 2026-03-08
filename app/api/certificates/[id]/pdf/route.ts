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

function drawRichCenteredParagraph(opts: {
  page: any;
  y: number;
  size: number;
  maxWidth: number;
  lineHeight: number;
  color: any;
  regularFont: any;
  boldFont: any;
  segments: Array<{ text: string; bold?: boolean }>;
}) {
  const {
    page,
    y,
    size,
    maxWidth,
    lineHeight,
    color,
    regularFont,
    boldFont,
    segments,
  } = opts;

  const tokens: Array<{ text: string; bold: boolean }> = [];

  segments.forEach((segment) => {
    const parts = segment.text.split(" ");
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const tokenText = isLast ? part : `${part} `;
      if (tokenText) {
        tokens.push({ text: tokenText, bold: !!segment.bold });
      }
    });
    tokens.push({ text: " ", bold: !!segment.bold });
  });

  if (tokens.length && tokens[tokens.length - 1].text === " ") {
    tokens.pop();
  }

  const lines: Array<Array<{ text: string; bold: boolean }>> = [];
  let currentLine: Array<{ text: string; bold: boolean }> = [];
  let currentWidth = 0;

  for (const token of tokens) {
    const font = token.bold ? boldFont : regularFont;
    const tokenWidth = font.widthOfTextAtSize(token.text, size);

    if (currentWidth + tokenWidth <= maxWidth || currentLine.length === 0) {
      currentLine.push(token);
      currentWidth += tokenWidth;
    } else {
      lines.push(currentLine);
      currentLine = [{ ...token }];
      currentWidth = tokenWidth;
    }
  }

  if (currentLine.length) lines.push(currentLine);

  lines.forEach((lineTokens, lineIndex) => {
    const lineWidth = lineTokens.reduce((acc, token) => {
      const font = token.bold ? boldFont : regularFont;
      return acc + font.widthOfTextAtSize(token.text, size);
    }, 0);

    let x = (page.getWidth() - lineWidth) / 2;
    const lineY = y - lineIndex * lineHeight;

    for (const token of lineTokens) {
      const font = token.bold ? boldFont : regularFont;
      page.drawText(token.text, {
        x,
        y: lineY,
        size,
        font,
        color,
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
    const primaryBlue = rgb(6 / 255, 166 / 255, 255 / 255); // #06A6FF
    const orange = rgb(251 / 255, 90 / 255, 0 / 255); // #FB5A00
    const yellow = rgb(243 / 255, 200 / 255, 15 / 255); // #F3C80F
    const black = rgb(0, 0, 0);
    const white = rgb(1, 1, 1);
    const softGray = rgb(0.35, 0.35, 0.35);
    const darkBlueSoft = rgb(0.14, 0.2, 0.45);
    const lightGrayBlue = rgb(0.92, 0.94, 0.98);
    const paleBlue = rgb(0.85, 0.94, 0.99);

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const logoImage = await pdfDoc.embedPng(logoBytes);
    const signatureImage = await pdfDoc.embedPng(signatureBytes);
    const qrImage = await pdfDoc.embedPng(qrPng);

    // Fondo base
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: white,
    });

    // Fondo decorativo suave inferior derecho
    page.drawEllipse({
      x: width - 130,
      y: 115,
      xScale: 115,
      yScale: 125,
      color: lightGrayBlue,
      opacity: 0.9,
    });

    page.drawEllipse({
      x: width - 210,
      y: 65,
      xScale: 65,
      yScale: 55,
      color: paleBlue,
      opacity: 0.45,
    });

    // Puntos decorativos
    const dotStartX = width - 150;
    const dotStartY = 70;
    const dotGap = 12;
    const dotRadius = 2.1;

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        if ((row + col) % 2 === 0) {
          page.drawCircle({
            x: dotStartX + col * dotGap,
            y: dotStartY + row * dotGap,
            size: dotRadius,
            color: primaryBlue,
            opacity: 0.75,
          });
        }
      }
    }

    // Marco exterior más elegante
    page.drawRectangle({
      x: 18,
      y: 18,
      width: width - 36,
      height: height - 36,
      borderColor: darkBlueSoft,
      borderWidth: 6,
      color: white,
    });

    // Marco interior fino
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: rgb(0.83, 0.86, 0.93),
      borderWidth: 1.2,
    });

    // Esquinas/acabados
    page.drawLine({
      start: { x: 30, y: height - 30 },
      end: { x: 78, y: height - 30 },
      thickness: 2.5,
      color: primaryBlue,
    });
    page.drawLine({
      start: { x: width - 78, y: height - 30 },
      end: { x: width - 30, y: height - 30 },
      thickness: 2.5,
      color: orange,
    });
    page.drawLine({
      start: { x: 30, y: 30 },
      end: { x: 78, y: 30 },
      thickness: 2.5,
      color: yellow,
    });
    page.drawLine({
      start: { x: width - 78, y: 30 },
      end: { x: width - 30, y: 30 },
      thickness: 2.5,
      color: primaryBlue,
    });

    // Logo arriba derecha
    const logoDims = logoImage.scale(0.048);
    page.drawImage(logoImage, {
      x: width - logoDims.width - 48,
      y: height - 86,
      width: logoDims.width,
      height: logoDims.height,
    });

    // Texto superior
    drawCenteredText({
      page,
      text: 'Corporación de Educación Luis Llerena “CEDULL” otorga el presente',
      font: fontRegular,
      size: 14.5,
      y: height - 118,
      color: black,
    });

    // Título
    drawCenteredText({
      page,
      text: "CERTIFICADO",
      font: fontBold,
      size: 31,
      y: height - 172,
      color: darkBlueSoft,
    });

    // Subtítulo
    drawCenteredText({
      page,
      text: "Otorgado a:",
      font: fontRegular,
      size: 15,
      y: height - 205,
      color: darkBlueSoft,
    });

    // Nombre
    let nameSize = 24;
    if (cert.fullName.length > 34) nameSize = 21;
    if (cert.fullName.length > 48) nameSize = 18.5;

    drawCenteredText({
      page,
      text: cert.fullName.toUpperCase(),
      font: fontRegular,
      size: nameSize,
      y: height - 245,
      color: rgb(0.32, 0.32, 0.32),
    });

    // Línea fina bajo nombre
    page.drawLine({
      start: { x: width / 2 - 120, y: height - 252 },
      end: { x: width / 2 + 120, y: height - 252 },
      thickness: 1,
      color: rgb(0.82, 0.84, 0.9),
    });

    // Párrafo enriquecido
    drawRichCenteredParagraph({
      page,
      y: height - 312,
      size: 13.5,
      maxWidth: 560,
      lineHeight: 18,
      color: darkBlueSoft,
      regularFont: fontRegular,
      boldFont: fontBold,
      segments: [
        {
          text: "al haber aprobado satisfactoriamente el curso de",
        },
        {
          text: cert.program,
          bold: true,
        },
        {
          text: "con una",
        },
        {
          text: `duración de ${cert.hours} horas académicas`,
          bold: true,
        },
        {
          text: `, realizado del ${fmtDateLongEs(cert.startDate)} al ${fmtDateLongEs(
            cert.endDate
          )}.`,
        },
      ],
    });

    // QR sin marco y más arriba
    page.drawImage(qrImage, {
      x: 58,
      y: 78,
      width: 70,
      height: 70,
    });

    page.drawText(cert.code, {
      x: 50,
      y: 58,
      size: 8.8,
      font: fontBold,
      color: primaryBlue,
    });

    // Firma más arriba
    const sigDims = signatureImage.scale(0.24);
    const sigX = width / 2 - sigDims.width / 2;

    page.drawImage(signatureImage, {
      x: sigX,
      y: 92,
      width: sigDims.width,
      height: sigDims.height,
    });

    page.drawLine({
      start: { x: width / 2 - 95, y: 86 },
      end: { x: width / 2 + 95, y: 86 },
      thickness: 1,
      color: darkBlueSoft,
    });

    drawCenteredText({
      page,
      text: "JOSE LUIS LLERENA FLORES",
      font: fontBold,
      size: 10,
      y: 68,
      color: darkBlueSoft,
    });

    drawCenteredText({
      page,
      text: "Director de Formación Continua",
      font: fontRegular,
      size: 9,
      y: 54,
      color: darkBlueSoft,
    });

    // Fecha más arriba
    page.drawText(fmtDateLongEs(cert.issueDate), {
      x: width - 150,
      y: 106,
      size: 9.5,
      font: fontRegular,
      color: darkBlueSoft,
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