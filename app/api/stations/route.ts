import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Cached stations, read-only. Data is refreshed exclusively by the daily
 * cron (/api/stations/refresh) — never inline here — so a user opening the
 * stations page never triggers the heavy OCM/OSM import.
 */
export async function GET() {
  // image is excluded here to keep the list payload light —
  // the detail sheet fetches it lazily via /api/stations/[id]
  const stations = await prisma.station.findMany({
    orderBy: { maxPowerKw: "desc" },
    select: {
      id: true,
      ocmId: true,
      osmId: true,
      nameEn: true,
      nameAr: true,
      operator: true,
      latitude: true,
      longitude: true,
      address: true,
      town: true,
      status: true,
      connectors: true,
      maxPowerKw: true,
      totalPoints: true,
      pricing: true,
      source: true,
      updatedAt: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ stations });
}
