import { NextResponse } from "next/server";
import { refreshStationsFromOcm } from "@/lib/ocm";
import { refreshStationsFromOsm } from "@/lib/osm";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Manual / scheduled refresh (see vercel.json cron): merges OpenChargeMap
 * and OpenStreetMap sources; nearby duplicates are skipped.
 */
export async function POST() {
  const result: { ocm?: number; osm?: number; errors: string[] } = { errors: [] };

  try {
    result.ocm = await refreshStationsFromOcm();
  } catch (e) {
    result.errors.push(`OCM: ${e}`);
  }
  try {
    result.osm = await refreshStationsFromOsm();
  } catch (e) {
    result.errors.push(`OSM: ${e}`);
  }

  const imported = (result.ocm ?? 0) + (result.osm ?? 0);
  if (imported === 0 && result.errors.length > 0) {
    return NextResponse.json({ error: result.errors.join(" | ") }, { status: 502 });
  }
  return NextResponse.json({ imported, ...result });
}

export async function GET() {
  return POST();
}
