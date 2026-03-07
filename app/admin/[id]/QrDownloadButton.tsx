"use client";

import { Button } from "@/components/Button";

export default function QrDownloadButton({ dataUrl, filename }: { dataUrl: string; filename: string }) {
  function download() {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <Button type="button" onClick={download} variant="secondary">
      Descargar PNG
    </Button>
  );
}