import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: {
      name: true,
      email: true,
      phone: true,
      city: true,
      createdAt: true,
      onboarded: true,
      isAdmin: true,
      meterType: true,
      homeChargerKw: true,
      servicesTier: true,
    },
  });
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.city === "string") data.city = body.city;
  if (typeof body.onboarded === "boolean") data.onboarded = body.onboarded;
  if (body.meterType === "EV_METER" || body.meterType === "SERVICES_METER") data.meterType = body.meterType;
  if ([2.3, 3.7, 7.4, 11].includes(Number(body.homeChargerKw))) data.homeChargerKw = Number(body.homeChargerKw);
  if ([1, 2, 3].includes(Number(body.servicesTier))) data.servicesTier = Number(body.servicesTier);

  const user = await prisma.user.update({ where: { id: uid }, data });
  return NextResponse.json({ ok: true, user: { name: user.name, city: user.city } });
}

/** Permanently delete the account and everything attached to it. */
export async function DELETE() {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: uid }, select: { phone: true } });
  // vehicles / sessions / favorites / reports cascade via the schema
  await prisma.user.delete({ where: { id: uid } });
  if (user?.phone) {
    await prisma.otpCode.deleteMany({ where: { phone: user.phone } });
  }
  return NextResponse.json({ ok: true });
}
