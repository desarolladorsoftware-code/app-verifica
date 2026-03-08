import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { qrBuffer } from "@/lib/qr";
import { getSessionTokenFromRequestHeaders, verifySession } from "@/lib/auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type RGB = ReturnType<typeof rgb>;

type RichSegment = {
  text: string;
  bold?: boolean;
};

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
  color?: RGB;
}) {
  const { page, text, font, size, y, color } = opts;
  const textWidth = font.widthOfTextAtSize(text, size);
  const x = (page.getWidth() - textWidth) / 2;

  page.drawText(text, {
    x,
    y,
    size,
    font,
    color: color || rgb(0, 0, 0),
  });
}

function wrapRichText(opts: {
  segments: RichSegment[];
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
  regularColor: RGB;
  boldColor: RGB;
  segments: RichSegment[];
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

    const COLORS = {
      blue: rgb(6 / 255, 166 / 255, 255 / 255),      // #06A6FF
      orange: rgb(251 / 255, 90 / 255, 0 / 255),     // #FB5A00
      yellow: rgb(243 / 255, 200 / 255, 15 / 255),   // #F3C80F
      white: rgb(1, 1, 1),                           // #FFFFFF
      black: rgb(0, 0, 0),                           // #000000
      body: rgb(0.20, 0.20, 0.20),
      soft: rgb(0.30, 0.30, 0.30),
    };

    const FONTS = {
      regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    };

    const logoImage = await pdfDoc.embedPng(logoBytes);
    const signatureImage = await pdfDoc.embedPng(signatureBytes);
    const qrImage = await pdfDoc.embedPng(qrPng);

    const LAYOUT = {
      page: { width, height },

      // Marcos
      outerFrame: {
        x: 2,
        y: 2,
        width: width - 4,
        height: height - 4,
        borderWidth: 18,
      },
      innerFrame: {
        x: 27,
        y: 27,
        width: width - 54,
        height: height - 54,
        borderWidth: 4,
      },

      // Remates
      frameAccents: {
        topLeftX: 27,
        topRightX: width - 97,
        bottomLeftX: 27,
        bottomRightX: width - 97,
        yTop: height - 10,
        yBottom: 7,
        width: 70,
        height: 3,
      },

      // Offsets globales por zona
      offsets: {
        header: 14, // sube o baja TODO el bloque superior
        body: 0,
        footer: 0,
      },

      // Header
      header: {
        logoRight: 52,
        logoTop: 88,
        logoScale: 0.042,

        institutionalTextY: height - 92,
        titleY: height - 148,
        titleUnderlineY: height - 156,
        subtitleY: height - 188,
        nameY: height - 235,
        nameUnderlineY: height - 244,
      },

      // Body
      body: {
        paragraphY: height - 302,
        paragraphMaxWidth: 575,
        paragraphSize: 12.5,
        paragraphLineHeight: 17,
      },

      // Footer
      footer: {
        qrX: 58,
        qrY: 74,
        qrSize: 58,
        codeX: 46,
        codeY: 56,

        signatureY: 90,
        signatureScale: 0.215,
        signatureLineY: 82,
        signerNameY: 66,
        signerRoleY: 50,

        dateBlockX: width - 144,
        dateLabelY: 68,
        dateValueY: 52,
      },
    };

    // Helpers de zonas
    const HY = (y: number) => y - LAYOUT.offsets.header;
    const BY = (y: number) => y - LAYOUT.offsets.body;
    const FY = (y: number) => y - LAYOUT.offsets.footer;

    // Fondo
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: COLORS.white,
    });

    // Borde exterior celeste
    page.drawRectangle({
      x: LAYOUT.outerFrame.x,
      y: LAYOUT.outerFrame.y,
      width: LAYOUT.outerFrame.width,
      height: LAYOUT.outerFrame.height,
      borderColor: COLORS.blue,
      borderWidth: LAYOUT.outerFrame.borderWidth,
    });

    // Marco interior dorado
    page.drawRectangle({
      x: LAYOUT.innerFrame.x,
      y: LAYOUT.innerFrame.y,
      width: LAYOUT.innerFrame.width,
      height: LAYOUT.innerFrame.height,
      borderColor: COLORS.yellow,
      borderWidth: LAYOUT.innerFrame.borderWidth,
    });

    // Remates
    page.drawRectangle({
      x: LAYOUT.frameAccents.topLeftX,
      y: LAYOUT.frameAccents.yTop,
      width: LAYOUT.frameAccents.width,
      height: LAYOUT.frameAccents.height,
      color: COLORS.blue,
    });

    page.drawRectangle({
      x: LAYOUT.frameAccents.topRightX,
      y: LAYOUT.frameAccents.yTop,
      width: LAYOUT.frameAccents.width,
      height: LAYOUT.frameAccents.height,
      color: COLORS.orange,
    });

    page.drawRectangle({
      x: LAYOUT.frameAccents.bottomLeftX,
      y: LAYOUT.frameAccents.yBottom,
      width: LAYOUT.frameAccents.width,
      height: LAYOUT.frameAccents.height,
      color: COLORS.yellow,
    });

    page.drawRectangle({
      x: LAYOUT.frameAccents.bottomRightX,
      y: LAYOUT.frameAccents.yBottom,
      width: LAYOUT.frameAccents.width,
      height: LAYOUT.frameAccents.height,
      color: COLORS.blue,
    });

    // Logo
    const logoDims = logoImage.scale(LAYOUT.header.logoScale);
    page.drawImage(logoImage, {
      x: width - logoDims.width - LAYOUT.header.logoRight,
      y: HY(height - LAYOUT.header.logoTop),
      width: logoDims.width,
      height: logoDims.height,
    });

    // Texto institucional
    drawCenteredText({
      page,
      text: 'Corporación de Educación Luis Llerena “CEDULL” otorga el presente',
      font: FONTS.regular,
      size: 12.8,
      y: HY(LAYOUT.header.institutionalTextY),
      color: COLORS.black,
    });

    // Título
    drawCenteredText({
      page,
      text: "CERTIFICADO",
      font: FONTS.bold,
      size: 29,
      y: HY(LAYOUT.header.titleY),
      color: COLORS.black,
    });

    // Línea naranja bajo título
    page.drawRectangle({
      x: width / 2 - 72,
      y: HY(LAYOUT.header.titleUnderlineY),
      width: 144,
      height: 2.5,
      color: COLORS.orange,
    });

    // Subtítulo
    drawCenteredText({
      page,
      text: "Otorgado a:",
      font: FONTS.bold,
      size: 15,
      y: HY(LAYOUT.header.subtitleY),
      color: COLORS.blue,
    });

    // Nombre
    let nameSize = 25;
    if (cert.fullName.length > 30) nameSize = 22;
    if (cert.fullName.length > 42) nameSize = 19;

    drawCenteredText({
      page,
      text: cert.fullName.toUpperCase(),
      font: FONTS.bold,
      size: nameSize,
      y: HY(LAYOUT.header.nameY),
      color: COLORS.black,
    });

    // Línea amarilla bajo nombre
    page.drawRectangle({
      x: width / 2 - 145,
      y: HY(LAYOUT.header.nameUnderlineY),
      width: 290,
      height: 2.2,
      color: COLORS.yellow,
    });

    // Párrafo central
    drawRichCenteredParagraph({
      page,
      y: BY(LAYOUT.body.paragraphY),
      size: LAYOUT.body.paragraphSize,
      maxWidth: LAYOUT.body.paragraphMaxWidth,
      lineHeight: LAYOUT.body.paragraphLineHeight,
      regularFont: FONTS.regular,
      boldFont: FONTS.bold,
      regularColor: COLORS.body,
      boldColor: COLORS.body,
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

    // QR
    page.drawImage(qrImage, {
      x: LAYOUT.footer.qrX,
      y: FY(LAYOUT.footer.qrY),
      width: LAYOUT.footer.qrSize,
      height: LAYOUT.footer.qrSize,
    });

    page.drawText(cert.code, {
      x: LAYOUT.footer.codeX,
      y: FY(LAYOUT.footer.codeY),
      size: 8.8,
      font: FONTS.bold,
      color: COLORS.blue,
    });

    // Firma
    const sigDims = signatureImage.scale(LAYOUT.footer.signatureScale);
    const sigX = width / 2 - sigDims.width / 2;

    page.drawImage(signatureImage, {
      x: sigX,
      y: FY(LAYOUT.footer.signatureY),
      width: sigDims.width,
      height: sigDims.height,
    });

    page.drawLine({
      start: { x: width / 2 - 102, y: FY(LAYOUT.footer.signatureLineY) },
      end: { x: width / 2 + 102, y: FY(LAYOUT.footer.signatureLineY) },
      thickness: 1,
      color: COLORS.body,
    });

    drawCenteredText({
      page,
      text: "JOSE LUIS LLERENA FLORES",
      font: FONTS.bold,
      size: 9.8,
      y: FY(LAYOUT.footer.signerNameY),
      color: COLORS.black,
    });

    drawCenteredText({
      page,
      text: "Director de Formación Continua",
      font: FONTS.regular,
      size: 8.8,
      y: FY(LAYOUT.footer.signerRoleY),
      color: COLORS.body,
    });

    // Fecha
    const dateLabel = "Fecha de emisión";
    const dateValue = fmtDateShort(cert.issueDate);

    page.drawText(dateLabel, {
      x: LAYOUT.footer.dateBlockX,
      y: FY(LAYOUT.footer.dateLabelY),
      size: 8.8,
      font: FONTS.bold,
      color: COLORS.orange,
    });

    page.drawText(dateValue, {
      x: LAYOUT.footer.dateBlockX,
      y: FY(LAYOUT.footer.dateValueY),
      size: 13,
      font: FONTS.bold,
      color: COLORS.black,
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