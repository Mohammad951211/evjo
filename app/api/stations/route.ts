import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { STATIONS_TAG } from "@/lib/cache";

/**
 * Public station list — identical for every user and only changes once a day
 * via the refresh cron. The result is cached (tagged STATIONS_TAG) so Postgres
 * isn't queried on every request; the cron and admin add/delete bust it with
 * revalidateStations(), so users never see data older than the last change.
 */
export const revalidate = 86400; // 24h fallback if nothing busts the tag

const getStations = unstable_cache(
  () =>
    prisma.station.findMany({
      orderBy: { maxPowerKw: "desc" },
      // image is excluded to keep the list payload light —
      // the detail sheet fetches it lazily via /api/stations/[id]
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
    }),
  ["stations-list"],
  { tags: [STATIONS_TAG], revalidate: 86400 },
);

export async function GET() {
  const stations = await getStations();
  return NextResponse.json({ stations });
}
