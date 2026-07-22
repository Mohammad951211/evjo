import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refreshStationsFromOcm } from "@/lib/ocm";

export const dynamic = "force-dynamic";

const STALE_MS = 24 * 3600_000;

/**
 * Cached fast stations. If the cache is older than 24h and an OCM key is
 * configured, refresh opportunistically before responding.
 */
export async function GET() {
  const newest = await prisma.station.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });

  const stale = !newest || Date.now() - newest.updatedAt.getTime() > STALE_MS;
  if (stale && process.env.OCM_API_KEY) {
    try {
      await refreshStationsFromOcm();
    } catch {
      // serve the cache on refresh failure
    }
  }

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
