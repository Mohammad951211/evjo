import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Seeded vehicle catalog, ordered for the make → model → variant cascade.
 * Returns the full list by default (the picker needs every make/model to build
 * its cascading selects). Pass ?limit (and optional ?offset) to page through it;
 * the response then includes total/limit/offset.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderBy = [{ make: "asc" }, { model: "asc" }, { batteryKwh: "asc" }] as const;

  const limitParam = searchParams.get("limit");
  if (limitParam === null) {
    const vehicles = await prisma.vehicle.findMany({ orderBy: [...orderBy] });
    return NextResponse.json({ vehicles });
  }

  const limit = Math.min(500, Math.max(1, parseInt(limitParam, 10) || 50));
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0);
  const [total, vehicles] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.findMany({ orderBy: [...orderBy], skip: offset, take: limit }),
  ]);
  return NextResponse.json({ vehicles, total, limit, offset });
}
