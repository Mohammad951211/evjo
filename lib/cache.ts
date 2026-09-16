import { revalidateTag } from "next/cache";

/** Cache tag for the public station list — see app/api/stations/route.ts. */
export const STATIONS_TAG = "stations";

/**
 * Bust the cached /api/stations response. Call after anything that changes the
 * station list: the daily refresh cron, or an admin adding/removing a station.
 */
export function revalidateStations() {
  revalidateTag(STATIONS_TAG);
}
