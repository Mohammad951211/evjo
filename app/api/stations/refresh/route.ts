import { NextResponse } from "next/server";
import { refreshStationsFromOcm } from "@/lib/ocm";
import { refreshStationsFromOsm } from "@/lib/osm";
import { currentUserId } from "@/lib/session";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Authorize a refresh request. Allowed callers:
 *  - the Vercel cron, which sends `Authorization: Bearer <CRON_SECRET>` when the
 *    CRON_SECRET env var is set on the project;
 *  - any signed-in user (the manual "refresh" button on the stations page).
 * Anonymous callers are rejected so this state-changing endpoint can't be abused.
 */
async function authorized(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return true;
  }
  return Boolean(await currentUserId());
}

/**
 * Manual / scheduled refresh (see vercel.json cron): merges OpenChargeMap
 * and OpenStreetMap sources; nearby duplicates are skipped.
 */
async function runRefresh() {
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

export async function POST(req: Request) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return runRefresh();
}

export async function GET(req: Request) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return runRefresh();
}
