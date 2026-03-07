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
    alert("clic detectado");
    console.log("clic detectado", { dataUrl, filename });
  }

  return (
    <Button type="button" onClick={download} variant="secondary">
      Descargar PNG
    </Button>
  );
}