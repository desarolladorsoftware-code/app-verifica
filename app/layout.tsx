import "./globals.css";
import React from "react";

export const metadata = {
  title: "Verificación de Certificados",
  description: "Verifica certificados por código o QR."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-PE">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}