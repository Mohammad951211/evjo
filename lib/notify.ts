import { prisma } from "@/lib/prisma";
import { StationStatus, NotificationType } from "@prisma/client";

export type StationSnapshot = Map<string, { status: StationStatus; pricing: string | null }>;

/** Snapshot every station's status + pricing so a later diff can spot changes. */
export async function snapshotStations(): Promise<StationSnapshot> {
  const snap: StationSnapshot = new Map();
  const rows = await prisma.station.findMany({ select: { id: true, status: true, pricing: true } });
  for (const s of rows) snap.set(s.id, { status: s.status, pricing: s.pricing });
  return snap;
}

/**
 * Compare stations against a pre-refresh snapshot and create in-app
 * notifications for users who favorited a station that just went OFFLINE or
 * changed price. Runs inside the daily refresh cron. Returns rows created.
 */
export async function notifyFavoriteStationChanges(before: StationSnapshot): Promise<number> {
  const after = await prisma.station.findMany({
    select: { id: true, nameEn: true, nameAr: true, status: true, pricing: true },
  });

  type Change = {
    stationId: string;
    nameEn: string;
    nameAr: string | null;
    type: NotificationType;
    oldValue: string | null;
    newValue: string | null;
  };
  const changes: Change[] = [];
  for (const s of after) {
    const prev = before.get(s.id);
    if (!prev) continue; // brand-new station this run — not a "change"
    if (prev.status !== "OFFLINE" && s.status === "OFFLINE") {
      changes.push({
        stationId: s.id, nameEn: s.nameEn, nameAr: s.nameAr,
        type: NotificationType.STATION_OFFLINE, oldValue: null, newValue: null,
      });
    }
    if ((prev.pricing ?? "") !== (s.pricing ?? "")) {
      changes.push({
        stationId: s.id, nameEn: s.nameEn, nameAr: s.nameAr,
        type: NotificationType.STATION_PRICE, oldValue: prev.pricing, newValue: s.pricing,
      });
    }
  }
  if (changes.length === 0) return 0;

  const favs = await prisma.favorite.findMany({
    where: { stationId: { in: changes.map((c) => c.stationId) } },
    select: { userId: true, stationId: true },
  });
  if (favs.length === 0) return 0;

  const usersByStation = new Map<string, string[]>();
  for (const f of favs) {
    const arr = usersByStation.get(f.stationId) ?? [];
    arr.push(f.userId);
    usersByStation.set(f.stationId, arr);
  }

  const rows = changes.flatMap((c) =>
    (usersByStation.get(c.stationId) ?? []).map((userId) => ({
      userId,
      type: c.type,
      stationId: c.stationId,
      stationNameEn: c.nameEn,
      stationNameAr: c.nameAr,
      oldValue: c.oldValue,
      newValue: c.newValue,
    })),
  );
  if (rows.length === 0) return 0;
  await prisma.notification.createMany({ data: rows });
  return rows.length;
}
