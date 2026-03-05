import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@verifica.edu.edu.pe";
  const password = process.env.ADMIN_PASSWORD || "ChangeMeNow_12345";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash }
  });

  // Limpieza opcional: elimina rate limits expirados (no imprescindible)
  await prisma.rateLimit.deleteMany({
    where: { resetAt: { lt: new Date() } }
  });

  console.log("✅ Seed listo:");
  console.log("   ADMIN_EMAIL:", email);
  console.log("   ADMIN_PASSWORD:", password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });