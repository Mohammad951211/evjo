import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdminId } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Remove a manually added station. Imported stations (OCM/OSM) can't be
 * deleted here — the next refresh would just re-import them.
 */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await currentAdminId();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const station = await prisma.station.findUnique({ where: { id: params.id } });
  if (!station) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (station.source !== "MANUAL") {
    return NextResponse.json({ error: "only manual stations can be deleted" }, { status: 400 });
  }

  await prisma.station.delete({ where: { id: station.id } });
  return NextResponse.json({ ok: true });
}
