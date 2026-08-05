import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Self-service password change: verify the current password, set a new one. */
export async function POST(req: Request) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const current = String(body?.currentPassword ?? "");
  const next = String(body?.newPassword ?? "");
  if (!current || next.length < 6) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { passwordHash: true },
  });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });

  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "wrong_current" }, { status: 400 });

  await prisma.user.update({
    where: { id: uid },
    data: { passwordHash: await bcrypt.hash(next, 10) },
  });
  return NextResponse.json({ ok: true });
}
