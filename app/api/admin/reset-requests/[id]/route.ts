import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdminId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Mark a reset request handled (or dismiss it). Admin only. */
export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const admin = await currentAdminId();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await prisma.passwordResetRequest.update({
    where: { id: params.id },
    data: { status: "DONE" },
  });
  return NextResponse.json({ ok: true });
}
