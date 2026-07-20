import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { normalizeJordanPhone } from "@/lib/phone";

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const phone = normalizeJordanPhone(String(body?.phone ?? ""));
  const code = String(body?.code ?? "").trim();
  if (!phone || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const otp = await prisma.otpCode.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.expiresAt < new Date() || otp.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "expired" }, { status: 400 });
  }

  const hash = createHash("sha256").update(code).digest("hex");
  if (hash !== otp.codeHash) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ error: "wrong_code" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({ where: { phone }, data: { phoneVerified: true } }),
    prisma.otpCode.deleteMany({ where: { phone } }),
  ]);

  return NextResponse.json({ verified: true });
}
