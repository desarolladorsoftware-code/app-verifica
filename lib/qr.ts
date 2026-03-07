import QRCode from "qrcode";

/**
 * QR en PNG (base64)
 */
export async function qrDataUrl(text: string) {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 8,
    type: "image/png"
  });
}

/**
 * QR en SVG (alta calidad)
 */
export async function qrSvg(text: string) {
  return QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1
  });
}

/**
 * QR en buffer PNG (para descargas directas)
 */
export async function qrBuffer(text: string) {
  return QRCode.toBuffer(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 10,
    type: "png"
  });
}