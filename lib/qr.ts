import QRCode from "qrcode";

export async function qrDataUrl(text: string) {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 8,
    type: "image/png"
  });
}