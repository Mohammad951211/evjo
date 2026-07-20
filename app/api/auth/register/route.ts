import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeJordanPhone } from "@/lib/phone";
import { otpRequired } from "@/lib/sms";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.password || !body?.phone) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const phone = normalizeJordanPhone(String(body.phone));
  if (!phone) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }
  const email = body.email ? String(body.email).trim().toLowerCase() : null;

  const exists = await prisma.user.findFirst({
    where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
  });
  if (exists) {
    return NextResponse.json({ error: "exists" }, { status: 409 });
  }

  const needsOtp = otpRequired();
  const passwordHash = await bcrypt.hash(String(body.password), 10);
  const user = await prisma.user.create({
    data: {
      name: String(body.name),
      email,
      phone,
      passwordHash,
      // free-launch mode: account is active immediately, no SMS round-trip
      phoneVerified: !needsOtp,
    },
  });

  return NextResponse.json({ id: user.id, phone, otpRequired: needsOtp }, { status: 201 });
}
