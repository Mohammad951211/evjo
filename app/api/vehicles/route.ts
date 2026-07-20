import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Seeded vehicle catalog, ordered for the make → model → variant cascade. */
export async function GET() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: [{ make: "asc" }, { model: "asc" }, { batteryKwh: "asc" }],
  });
  return NextResponse.json({ vehicles });
}
