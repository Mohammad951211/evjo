import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Ids of the caller's starred stations. */
export async function GET() {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const favs = await prisma.favorite.findMany({
    where: { userId: uid },
    select: { stationId: true },
  });
  return NextResponse.json({ ids: favs.map((f) => f.stationId) });
}

/** Toggle a favorite. Returns the new state. */
export async function POST(req: Request) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const stationId = String(body?.stationId ?? "");
  if (!stationId) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const existing = await prisma.favorite.findUnique({
    where: { userId_stationId: { userId: uid, stationId } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }
  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.favorite.create({ data: { userId: uid, stationId } });
  return NextResponse.json({ favorited: true });
}
