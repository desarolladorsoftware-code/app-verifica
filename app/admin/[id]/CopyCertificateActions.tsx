"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

export default function CopyCertificateActions({
  code,
  publicUrl,
}: {
  code: string;
  publicUrl: string;
}) {
  const [copied, setCopied] = useState<"code" | "url" | null>(null);

  async function copyText(value: string, type: "code" | "url") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      setTimeout(() => setCopied(null), 1800);
    } catch (error) {
      console.error("No se pudo copiar:", error);
      alert("No se pudo copiar al portapapeles.");
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        type="button"
        variant="secondary"
        onClick={() => copyText(code, "code")}
      >
        {copied === "code" ? "Código copiado" : "Copiar código"}
      </Button>

      <Button
        type="button"
        variant="secondary"
        onClick={() => copyText(publicUrl, "url")}
      >
        {copied === "url" ? "URL copiada" : "Copiar URL"}
      </Button>
    </div>
  );
}