/**
 * Creates or promotes the admin account from ADMIN_PHONE / ADMIN_PASSWORD.
 * Run with: npx tsx scripts/create-admin.ts
 * Credentials live in .env (gitignored) — never hardcode them here.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normalizeJordanPhone } from "../lib/phone";

const prisma = new PrismaClient();

export async function upsertAdmin(): Promise<string | null> {
  const rawPhone = process.env.ADMIN_PHONE;
  const password = process.env.ADMIN_PASSWORD;
  if (!rawPhone || !password) {
    console.log("ADMIN_PHONE / ADMIN_PASSWORD not set — skipping admin.");
    return null;
  }
  const phone = normalizeJordanPhone(rawPhone) ?? rawPhone;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { phone },
    create: {
      name: "Admin",
      phone,
      passwordHash,
      isAdmin: true,
      phoneVerified: true,
      onboarded: true,
    },
    update: { isAdmin: true, phoneVerified: true, passwordHash },
  });
  return user.phone;
}

async function main() {
  const phone = await upsertAdmin();
  if (phone) console.log(`Admin ready: ${phone}`);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
