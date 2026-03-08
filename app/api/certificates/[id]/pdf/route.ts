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

function drawLineSegmentsCentered(opts: {
  page: any;
  y: number;
  size: number;
  segments: Array<{ text: string; font: any; color: any }>;
}) {
  const { page, y, size, segments } = opts;

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
    const brandBlue = rgb(6 / 255, 166 / 255, 255 / 255);   // #06A6FF
    const brandOrange = rgb(251 / 255, 90 / 255, 0 / 255); // #FB5A00
    const brandYellow = rgb(243 / 255, 200 / 255, 15 / 255); // #F3C80F
    const black = rgb(0, 0, 0);
    const white = rgb(1, 1, 1);
    const softGray = rgb(0.28, 0.28, 0.28);

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontTitle = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontName = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

    const logoImage = await pdfDoc.embedPng(logoBytes);
    const signatureImage = await pdfDoc.embedPng(signatureBytes);
    const qrImage = await pdfDoc.embedPng(qrPng);

    // =========================
    // FONDO Y MARCO PRINCIPAL
    // =========================
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: brandBlue,
    });

    // Lienzo blanco interior
    page.drawRectangle({
      x: 24,
      y: 24,
      width: width - 48,
      height: height - 48,
      color: white,
    });

    // Línea dorada interior principal
    page.drawRectangle({
      x: 38,
      y: 38,
      width: width - 76,
      height: height - 76,
      borderColor: brandYellow,
      borderWidth: 1.3,
    });

    // Recorte ornamental de esquinas tipo diploma
    const cornerR = 34;

    // Superior izquierda
    page.drawRectangle({
      x: 24,
      y: height - 24 - 54,
      width: 54,
      height: 54,
      color: white,
    });
    page.drawCircle({
      x: 78,
      y: height - 78,
      size: cornerR,
      borderColor: brandYellow,
      borderWidth: 2,
    });
    page.drawRectangle({
      x: 78,
      y: height - 44,
      width: 38,
      height: 38,
      color: white,
    });
    page.drawRectangle({
      x: 44,
      y: height - 78,
      width: 38,
      height: 38,
      color: white,
    });

    // Superior derecha
    page.drawRectangle({
      x: width - 78,
      y: height - 24 - 54,
      width: 54,
      height: 54,
      color: white,
    });
    page.drawCircle({
      x: width - 78,
      y: height - 78,
      size: cornerR,
      borderColor: brandYellow,
      borderWidth: 2,
    });
    page.drawRectangle({
      x: width - 116,
      y: height - 44,
      width: 38,
      height: 38,
      color: white,
    });
    page.drawRectangle({
      x: width - 78,
      y: height - 78,
      width: 38,
      height: 38,
      color: white,
    });

    // Inferior izquierda
    page.drawRectangle({
      x: 24,
      y: 24,
      width: 54,
      height: 54,
      color: white,
    });
    page.drawCircle({
      x: 78,
      y: 78,
      size: cornerR,
      borderColor: brandYellow,
      borderWidth: 2,
    });
    page.drawRectangle({
      x: 78,
      y: 40,
      width: 38,
      height: 38,
      color: white,
    });
    page.drawRectangle({
      x: 44,
      y: 78,
      width: 38,
      height: 38,
      color: white,
    });

    // Inferior derecha
    page.drawRectangle({
      x: width - 78,
      y: 24,
      width: 54,
      height: 54,
      color: white,
    });
    page.drawCircle({
      x: width - 78,
      y: 78,
      size: cornerR,
      borderColor: brandYellow,
      borderWidth: 2,
    });
    page.drawRectangle({
      x: width - 116,
      y: 40,
      width: 38,
      height: 38,
      color: white,
    });
    page.drawRectangle({
      x: width - 78,
      y: 78,
      width: 38,
      height: 38,
      color: white,
    });

    // Línea dorada superior e inferior visual tipo ejemplo
    page.drawLine({
      start: { x: 70, y: height - 24 },
      end: { x: width - 70, y: height - 24 },
      thickness: 2,
      color: brandYellow,
    });

    page.drawLine({
      start: { x: 70, y: 24 },
      end: { x: width - 70, y: 24 },
      thickness: 2,
      color: brandYellow,
    });

    // Puntos decorativos pequeños
    const points = [
      { x: 10, y: height - 10 },
      { x: width - 10, y: height - 10 },
      { x: 10, y: 10 },
      { x: width - 10, y: 10 },
    ];
    for (const p of points) {
      page.drawCircle({
        x: p.x,
        y: p.y,
        size: 4.5,
        color: brandYellow,
      });
    }

    // =========================
    // LOGO
    // =========================
    const logoDims = logoImage.scale(0.043);
    page.drawImage(logoImage, {
      x: width - logoDims.width - 58,
      y: height - 82,
      width: logoDims.width,
      height: logoDims.height,
    });

    // =========================
    // CABECERA
    // =========================
    drawCenteredText({
      page,
      text: 'Corporación de Educación Luis Llerena “CEDULL” otorga el presente',
      font: fontRegular,
      size: 13.5,
      y: height - 120,
      color: black,
    });

    drawCenteredText({
      page,
      text: "Certificado",
      font: fontTitle,
      size: 38,
      y: height - 190,
      color: black,
    });

    drawCenteredText({
      page,
      text: "OTORGADO A:",
      font: fontRegular,
      size: 15,
      y: height - 232,
      color: brandOrange,
    });

    // =========================
    // NOMBRE
    // =========================
    let nameSize = 35;
    if (cert.fullName.length > 28) nameSize = 31;
    if (cert.fullName.length > 40) nameSize = 27;

    drawCenteredText({
      page,
      text: cert.fullName,
      font: fontName,
      size: nameSize,
      y: height - 315,
      color: black,
    });

    page.drawLine({
      start: { x: width / 2 - 110, y: height - 327 },
      end: { x: width / 2 + 110, y: height - 327 },
      thickness: 1.4,
      color: brandYellow,
    });

    // =========================
    // PÁRRAFO
    // =========================
    const paragraphY = height - 390;
    const paragraphSize = 13.8;

    drawLineSegmentsCentered({
      page,
      y: paragraphY,
      size: paragraphSize,
      segments: [
        { text: "al haber aprobado ", font: fontRegular, color: softGray },
        { text: "satisfactoriamente", font: fontBold, color: softGray },
      ],
    });

    drawLineSegmentsCentered({
      page,
      y: paragraphY - 20,
      size: paragraphSize,
      segments: [
        { text: "el curso de ", font: fontRegular, color: softGray },
        { text: cert.program, font: fontBold, color: softGray },
        { text: " con una", font: fontRegular, color: softGray },
      ],
    });

    drawLineSegmentsCentered({
      page,
      y: paragraphY - 40,
      size: paragraphSize,
      segments: [
        {
          text: `duración de ${cert.hours} horas académicas`,
          font: fontBold,
          color: softGray,
        },
        { text: ",", font: fontRegular, color: softGray },
      ],
    });

    drawLineSegmentsCentered({
      page,
      y: paragraphY - 60,
      size: paragraphSize,
      segments: [
        { text: "realizado del ", font: fontRegular, color: softGray },
        {
          text: fmtDateLongEs(cert.startDate),
          font: fontRegular,
          color: softGray,
        },
        { text: " al ", font: fontRegular, color: softGray },
        {
          text: fmtDateLongEs(cert.endDate),
          font: fontRegular,
          color: softGray,
        },
        { text: ".", font: fontRegular, color: softGray },
      ],
    });

    // =========================
    // QR + CÓDIGO
    // =========================
    page.drawImage(qrImage, {
      x: 90,
      y: 98,
      width: 62,
      height: 62,
    });

    page.drawText(cert.code, {
      x: 84,
      y: 54,
      size: 10,
      font: fontBold,
      color: brandBlue,
    });

    // =========================
    // MEDALLA CENTRAL
    // =========================
    const medalX = width / 2;
    const medalY = 120;

    page.drawCircle({
      x: medalX,
      y: medalY,
      size: 31,
      borderColor: brandYellow,
      borderWidth: 1.2,
    });

    page.drawCircle({
      x: medalX,
      y: medalY,
      size: 25,
      borderColor: brandYellow,
      borderWidth: 1,
    });

    drawCenteredText({
      page,
      text: "CEDULL",
      font: fontBold,
      size: 8.5,
      y: medalY,
      color: brandYellow,
    });

    drawCenteredText({
      page,
      text: "2026",
      font: fontBold,
      size: 8.5,
      y: medalY - 13,
      color: brandYellow,
    });

    // =========================
    // FIRMA
    // =========================
    const sigDims = signatureImage.scale(0.21);
    const sigX = width / 2 - sigDims.width / 2;

    page.drawImage(signatureImage, {
      x: sigX,
      y: 128,
      width: sigDims.width,
      height: sigDims.height,
    });

    page.drawLine({
      start: { x: width / 2 - 92, y: 108 },
      end: { x: width / 2 + 92, y: 108 },
      thickness: 1,
      color: brandYellow,
    });

    drawCenteredText({
      page,
      text: "JOSE LUIS LLERENA FLORES",
      font: fontBold,
      size: 10.2,
      y: 90,
      color: black,
    });

    drawCenteredText({
      page,
      text: "Director de Formación Continua",
      font: fontRegular,
      size: 9.2,
      y: 74,
      color: softGray,
    });

    // =========================
    // FECHA
    // =========================
    const dateLabel = "Fecha de emisión: ";
    const dateValue = fmtDateLongEs(cert.issueDate);
    const dateSize = 10;

    const dateWidth =
      fontRegular.widthOfTextAtSize(dateLabel, dateSize) +
      fontRegular.widthOfTextAtSize(dateValue, dateSize);

    const dateX = width - 92 - dateWidth;

    page.drawText(dateLabel, {
      x: dateX,
      y: 54,
      size: dateSize,
      font: fontRegular,
      color: softGray,
    });

    page.drawText(dateValue, {
      x: dateX + fontRegular.widthOfTextAtSize(dateLabel, dateSize),
      y: 54,
      size: dateSize,
      font: fontRegular,
      color: softGray,
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