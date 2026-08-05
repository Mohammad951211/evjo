import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { currentAdminId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Generates a readable temporary password, e.g. "Eshhan-4821". */
function tempPassword(): string {
  return `Eshhan-${randomInt(1000, 10000)}`;
}

/**
 * Admin-assisted password reset: sets a new temporary password for a user
 * and returns it (once) so the admin can relay it. The user then changes it
 * from their profile. Admin only.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await currentAdminId();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, phone: true },
  });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });

  const temp = tempPassword();
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(temp, 10) },
  });

  return NextResponse.json({ ok: true, tempPassword: temp, phone: user.phone });
}
