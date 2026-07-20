import { NextResponse } from "next/server";
import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { normalizeJordanPhone } from "@/lib/phone";
import { sendSms, smsConfigured } from "@/lib/sms";

const CODE_TTL_MS = 5 * 60_000;
const RESEND_COOLDOWN_MS = 60_000;
const MAX_PER_HOUR = 5;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const phone = normalizeJordanPhone(String(body?.phone ?? ""));
  if (!phone) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (user.phoneVerified) {
    return NextResponse.json({ verified: true });
  }

  // rate limits: one per minute, five per hour. Without an SMS gateway
  // (dev mode) the cooldown is skipped so the on-screen code always shows.
  const gateway = smsConfigured();
  const lastHour = await prisma.otpCode.findMany({
    where: { phone, createdAt: { gte: new Date(Date.now() - 3600_000) } },
    orderBy: { createdAt: "desc" },
  });
  if (gateway && lastHour.length >= MAX_PER_HOUR) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  if (gateway && lastHour[0] && Date.now() - lastHour[0].createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const retryIn = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - lastHour[0].createdAt.getTime())) / 1000
    );
    return NextResponse.json({ error: "cooldown", retryIn }, { status: 429 });
  }

  const code = randomInt(100000, 1000000).toString();
  const codeHash = createHash("sha256").update(code).digest("hex");

  await prisma.otpCode.deleteMany({
    where: { phone, expiresAt: { lt: new Date() } },
  });
  await prisma.otpCode.create({
    data: { phone, codeHash, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });

  await sendSms(phone, `EV.JO — رمز التحقق: ${code}`);

  // Without a configured SMS gateway (dev/staging), surface the code so
  // the flow remains testable end-to-end.
  return NextResponse.json({
    sent: true,
    ...(smsConfigured() ? {} : { devCode: code }),
  });
}
