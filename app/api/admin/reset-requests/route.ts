import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdminId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Open password-reset requests — admin only, newest first. */
export async function GET() {
  const admin = await currentAdminId();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const requests = await prisma.passwordResetRequest.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ requests });
}
