import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdminId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Mark a report resolved / reopen it. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await currentAdminId();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const status = body?.status === "RESOLVED" ? "RESOLVED" : "OPEN";
  await prisma.stationReport.update({ where: { id: params.id }, data: { status } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await currentAdminId();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await prisma.stationReport.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
