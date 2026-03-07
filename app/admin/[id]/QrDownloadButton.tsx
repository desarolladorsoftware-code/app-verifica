"use client";

import { Button } from "@/components/Button";

export default function QrDownloadButton({
  dataUrl,
  filename,
}: {
  dataUrl: string;
  filename: string;
}) {
  async function download() {
    try {
      if (!dataUrl || typeof dataUrl !== "string") {
        console.error("dataUrl inválido:", dataUrl);
        alert("No se pudo generar el QR para descargar.");
        return;
      }

      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "qr.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando QR:", error);
      alert("Ocurrió un error al descargar el QR.");
    }
  }

  return (
    <Button type="button" onClick={download} variant="secondary">
      Descargar PNG
    </Button>
  );
}