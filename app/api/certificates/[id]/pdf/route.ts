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

function drawTextLineCentered(opts: {
  page: any;
  segments: Array<{ text: string; font: any; color: any }>;
  size: number;
  y: number;
}) {
  const { page, segments, size, y } = opts;

  const totalWidth = segments.reduce(
    (acc, seg) => acc + seg.font.widthOfTextAtSize(seg.text, size),
    0
  );

  let x = (page.getWidth() - totalWidth) / 2;

  for (const seg of segments) {
    page.drawText(seg.text, {
      x,
      y,
      size,
      font: seg.font,
      color: seg.color,
    });
    x += seg.font.widthOfTextAtSize(seg.text, size);
  }
}

function wrapSegmentsIntoLines(opts: {
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
    tokens.push({ text: " ", bold: !!segment.bold });
  }

  if (tokens.length && tokens[tokens.length - 1].text === " ") {
    tokens.pop();
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

  const lines = wrapSegmentsIntoLines({
    segments,
    regularFont,
    boldFont,
    size,
    maxWidth,
  });

  lines.forEach((line, index) => {
    const lineWidth = line.reduce((acc, token) => {
      const font = token.bold ? boldFont : regularFont;
      return acc + font.widthOfTextAtSize(token.text, size);
    }, 0);

    let x = (page.getWidth() - lineWidth) / 2;
    const lineY = y - index * lineHeight;

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
    const brandBlue = rgb(6 / 255, 166 / 255, 255 / 255); // #06A6FF
    const brandOrange = rgb(251 / 255, 90 / 255, 0 / 255); // #FB5A00
    const brandYellow = rgb(243 / 255, 200 / 255, 15 / 255); // #F3C80F
    const black = rgb(0, 0, 0);
    const white = rgb(1, 1, 1);

    // Tonos elegantes basados en marca
    const darkFrame = rgb(0.08, 0.14, 0.36);
    const goldSoft = rgb(0.84, 0.65, 0.29);
    const bodyText = rgb(0.16, 0.19, 0.34);
    const grayText = rgb(0.34, 0.34, 0.34);
    const lightFill = rgb(0.985, 0.985, 0.99);
    const softDecor = rgb(0.9, 0.95, 1);

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontTitle = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontName = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

    const logoImage = await pdfDoc.embedPng(logoBytes);
    const signatureImage = await pdfDoc.embedPng(signatureBytes);
    const qrImage = await pdfDoc.embedPng(qrPng);

    // Fondo
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: darkFrame,
    });

    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      color: lightFill,
    });

    // Marco interior fino
    page.drawRectangle({
      x: 35,
      y: 35,
      width: width - 70,
      height: height - 70,
      borderColor: goldSoft,
      borderWidth: 1.2,
    });

    // Borde ornamental superior e inferior
    page.drawLine({
      start: { x: 72, y: height - 22 },
      end: { x: width - 72, y: height - 22 },
      thickness: 3,
      color: goldSoft,
    });

    page.drawLine({
      start: { x: 72, y: 22 },
      end: { x: width - 72, y: 22 },
      thickness: 3,
      color: goldSoft,
    });

    // Lados ornamentales
    page.drawLine({
      start: { x: 22, y: 72 },
      end: { x: 22, y: height - 72 },
      thickness: 3,
      color: goldSoft,
    });

    page.drawLine({
      start: { x: width - 22, y: 72 },
      end: { x: width - 22, y: height - 72 },
      thickness: 3,
      color: goldSoft,
    });

    // Esquinas curvas simuladas
    const r = 52;

    // superior izquierda
    page.drawRectangle({ x: 22, y: height - 72, width: r, height: r, color: lightFill });
    page.drawEllipse({
      x: 74,
      y: height - 74,
      xScale: 44,
      yScale: 44,
      borderColor: goldSoft,
      borderWidth: 3,
    });

    // superior derecha
    page.drawRectangle({
      x: width - 74,
      y: height - 72,
      width: r,
      height: r,
      color: lightFill,
    });
    page.drawEllipse({
      x: width - 74,
      y: height - 74,
      xScale: 44,
      yScale: 44,
      borderColor: goldSoft,
      borderWidth: 3,
    });

    // inferior izquierda
    page.drawRectangle({ x: 22, y: 22, width: r, height: r, color: lightFill });
    page.drawEllipse({
      x: 74,
      y: 74,
      xScale: 44,
      yScale: 44,
      borderColor: goldSoft,
      borderWidth: 3,
    });

    // inferior derecha
    page.drawRectangle({
      x: width - 74,
      y: 22,
      width: r,
      height: r,
      color: lightFill,
    });
    page.drawEllipse({
      x: width - 74,
      y: 74,
      xScale: 44,
      yScale: 44,
      borderColor: goldSoft,
      borderWidth: 3,
    });

    // Puntos decorativos exteriores
    const outerDots = [
      [12, height - 12],
      [width - 12, height - 12],
      [12, 12],
      [width - 12, 12],
    ];
    for (const [x, y] of outerDots) {
      page.drawCircle({
        x,
        y,
        size: 4.5,
        color: goldSoft,
      });
    }

    // Decoración inferior derecha suave
    page.drawEllipse({
      x: width - 115,
      y: 132,
      xScale: 98,
      yScale: 110,
      color: softDecor,
      opacity: 0.5,
    });

    page.drawEllipse({
      x: width - 200,
      y: 84,
      xScale: 54,
      yScale: 42,
      color: brandBlue,
      opacity: 0.07,
    });

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        if ((row + col) % 2 === 0) {
          page.drawCircle({
            x: width - 158 + col * 11,
            y: 76 + row * 11,
            size: 1.8,
            color: brandBlue,
            opacity: 0.55,
          });
        }
      }
    }

    // Logo arriba derecha
    const logoDims = logoImage.scale(0.044);
    page.drawImage(logoImage, {
      x: width - logoDims.width - 62,
      y: height - 82,
      width: logoDims.width,
      height: logoDims.height,
    });

    // Texto institucional superior
    drawCenteredText({
      page,
      text: 'Corporación de Educación Luis Llerena “CEDULL” otorga el presente',
      font: fontRegular,
      size: 13.5,
      y: height - 118,
      color: bodyText,
    });

    // Título principal con serif elegante
    drawCenteredText({
      page,
      text: "Certificado",
      font: fontTitle,
      size: 42,
      y: height - 190,
      color: darkFrame,
    });

    // Subtítulo
    drawCenteredText({
      page,
      text: "OTORGADO A:",
      font: fontRegular,
      size: 15,
      y: height - 232,
      color: goldSoft,
    });

    // Nombre principal
    let nameSize = 40;
    if (cert.fullName.length > 28) nameSize = 34;
    if (cert.fullName.length > 40) nameSize = 29;

    drawCenteredText({
      page,
      text: cert.fullName,
      font: fontName,
      size: nameSize,
      y: height - 315,
      color: darkFrame,
    });

    // Línea decorativa bajo nombre
    page.drawLine({
      start: { x: width / 2 - 122, y: height - 328 },
      end: { x: width / 2 + 122, y: height - 328 },
      thickness: 1.4,
      color: goldSoft,
    });

    // Párrafo principal
    drawRichCenteredParagraph({
      page,
      y: height - 388,
      size: 14,
      maxWidth: 570,
      lineHeight: 19,
      regularFont: fontRegular,
      boldFont: fontBold,
      regularColor: bodyText,
      boldColor: bodyText,
      segments: [
        { text: "al haber aprobado satisfactoriamente el curso de " },
        { text: cert.program, bold: true },
        { text: " con una " },
        { text: `duración de ${cert.hours} horas académicas`, bold: true },
        {
          text: `, realizado del ${fmtDateLongEs(cert.startDate)} al ${fmtDateLongEs(
            cert.endDate
          )}.`,
        },
      ],
    });

    // QR abajo izquierda sin marco
    page.drawImage(qrImage, {
      x: 88,
      y: 102,
      width: 66,
      height: 66,
    });

    page.drawText(`ID del certificado: ${cert.code}`, {
      x: 86,
      y: 52,
      size: 10,
      font: fontRegular,
      color: bodyText,
    });

    // Medalla central decorativa
    page.drawCircle({
      x: width / 2,
      y: 116,
      size: 34,
      borderColor: goldSoft,
      borderWidth: 1.5,
    });
    page.drawCircle({
      x: width / 2,
      y: 116,
      size: 28,
      borderColor: goldSoft,
      borderWidth: 1,
    });
    drawCenteredText({
      page,
      text: "CEDULL",
      font: fontBold,
      size: 9,
      y: 116,
      color: goldSoft,
    });
    drawCenteredText({
      page,
      text: "2026",
      font: fontBold,
      size: 9,
      y: 102,
      color: goldSoft,
    });

    // Firma izquierda-centro visualmente
    const sigDims = signatureImage.scale(0.22);
    const sigX = width / 2 - sigDims.width / 2;

    page.drawImage(signatureImage, {
      x: sigX,
      y: 124,
      width: sigDims.width,
      height: sigDims.height,
    });

    page.drawLine({
      start: { x: width / 2 - 92, y: 108 },
      end: { x: width / 2 + 92, y: 108 },
      thickness: 1,
      color: goldSoft,
    });

    drawCenteredText({
      page,
      text: "JOSE LUIS LLERENA FLORES",
      font: fontBold,
      size: 10.5,
      y: 90,
      color: darkFrame,
    });

    drawCenteredText({
      page,
      text: "Director de Formación Continua",
      font: fontRegular,
      size: 9.5,
      y: 74,
      color: bodyText,
    });

    // Fecha de emisión abajo derecha
    drawTextLineCentered({
      page,
      size: 10,
      y: 52,
      segments: [
        { text: "Fecha de emisión: ", font: fontRegular, color: bodyText },
        { text: fmtDateLongEs(cert.issueDate), font: fontRegular, color: bodyText },
      ],
    });

    // Ajuste de la fecha a la derecha real
    const dateLabel = "Fecha de emisión: ";
    const dateValue = fmtDateLongEs(cert.issueDate);
    const dateWidth =
      fontRegular.widthOfTextAtSize(dateLabel, 10) +
      fontRegular.widthOfTextAtSize(dateValue, 10);

    let dateX = width - 86 - dateWidth;
    if (dateX < width / 2 + 120) {
      dateX = width / 2 + 120;
    }

    page.drawText(dateLabel, {
      x: dateX,
      y: 52,
      size: 10,
      font: fontRegular,
      color: bodyText,
    });

    page.drawText(dateValue, {
      x: dateX + fontRegular.widthOfTextAtSize(dateLabel, 10),
      y: 52,
      size: 10,
      font: fontRegular,
      color: bodyText,
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