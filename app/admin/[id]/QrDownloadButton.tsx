"use client";

import { Button } from "@/components/Button";

export default function QrDownloadButton({
  dataUrl,
  filename,
}: {
  dataUrl: string;
  filename: string;
}) {
  function download() {
    try {
      const arr = dataUrl.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      const blob = new Blob([u8arr], { type: mime });
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
    }
  }

  return (
    <Button type="button" onClick={download} variant="secondary">
      Descargar PNG
    </Button>
  );
}