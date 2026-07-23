import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** "This station didn't work" — community report, reviewed in the admin panel. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const station = await prisma.station.findUnique({ where: { id: params.id } });
  if (!station) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : null;

  // one open report per user per station — repeat taps just refresh the note
  const open = await prisma.stationReport.findFirst({
    where: { userId: uid, stationId: station.id, status: "OPEN" },
  });
  if (open) {
    await prisma.stationReport.update({
      where: { id: open.id },
      data: { note: note ?? open.note },
    });
    return NextResponse.json({ ok: true, updated: true });
  }

  await prisma.stationReport.create({
    data: { userId: uid, stationId: station.id, note: note || null },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
