import { prisma } from "@/lib/db";

function randChar() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin I,O,1,0
  return chars[Math.floor(Math.random() * chars.length)];
}

function randomBlock(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += randChar();
  return s;
}

export async function generateUniqueCode(prefix = "CEDULL") {
  const year = new Date().getFullYear();
  for (let i = 0; i < 10; i++) {
    const code = `${prefix}-${year}-${randomBlock(6)}`;
    const exists = await prisma.certificate.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error("No se pudo generar un código único (reintentos agotados)");
}