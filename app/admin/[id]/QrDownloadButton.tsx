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
    console.log("clic detectado", { filename, dataUrl: dataUrl?.slice(0, 40) });
  }

  return (
    <Button type="button" onClick={download} variant="secondary">
      Descargar PNG
    </Button>
  );
}