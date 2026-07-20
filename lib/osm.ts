import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/geo";

/**
 * Imports charging stations mapped in OpenStreetMap for Jordan via the
 * Overpass API (free, no key). Stations within 200 m of an already-known
 * station are treated as duplicates and skipped.
 */

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const DEDUPE_KM = 0.2;

const QUERY = `
[out:json][timeout:60];
area["ISO3166-1"="JO"][admin_level=2]->.jo;
(
  node["amenity"="charging_station"](area.jo);
  way["amenity"="charging_station"](area.jo);
);
out center tags;
`;

interface OsmElement {
  type: "node" | "way";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function parseKw(v: string | undefined): number {
  if (!v) return 0;
  const m = v.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

function connectorsFromTags(tags: Record<string, string>) {
  const conns: { type: string; powerKw: number; quantity: number }[] = [];
  const push = (tagBase: string, type: string) => {
    const count = parseInt(tags[tagBase] ?? "", 10);
    if (!count || count <= 0) return;
    conns.push({
      type,
      powerKw: parseKw(tags[`${tagBase}:output`]),
      quantity: count,
    });
  };
  push("socket:type2_combo", "CCS2");
  push("socket:chademo", "CHADEMO");
  push("socket:gb_dc", "GBT_DC");
  push("socket:type2", "TYPE2");
  push("socket:type2_cable", "TYPE2");
  return conns;
}

export async function refreshStationsFromOsm(): Promise<number> {
  // the public Overpass servers rate-limit/queue aggressively — try mirrors
  let json: { elements: OsmElement[] } | null = null;
  let lastStatus = 0;
  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "EVJO/1.0 (EV companion app, Jordan)",
        },
        body: new URLSearchParams({ data: QUERY }),
        cache: "no-store",
      });
      if (res.ok) {
        json = (await res.json()) as { elements: OsmElement[] };
        break;
      }
      lastStatus = res.status;
    } catch {
      // network error — try the next mirror
    }
  }
  if (!json) throw new Error(`Overpass responded ${lastStatus || "network error"}`);

  const existing = await prisma.station.findMany({
    select: { latitude: true, longitude: true, osmId: true },
  });

  let imported = 0;
  for (const el of json.elements ?? []) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;

    const osmId = `${el.type}/${el.id}`;
    const tags = el.tags ?? {};
    const conns = connectorsFromTags(tags);
    const declared = parseKw(tags["charging_station:output"] ?? tags["output"]);
    const maxPowerKw = Math.max(declared, ...conns.map((c) => c.powerKw), 0);

    const alreadyImported = existing.some((s) => s.osmId === osmId);
    // proximity dedupe against stations from other sources
    const duplicateNearby =
      !alreadyImported &&
      existing.some(
        (s) => s.osmId !== osmId && haversineKm(lat, lng, s.latitude, s.longitude) < DEDUPE_KM
      );
    if (duplicateNearby) continue;

    const name =
      tags["name:en"] ?? tags.name ?? tags.operator ?? "EV Charging Station";
    const data = {
      nameEn: name,
      nameAr: tags["name:ar"] ?? (tags.name && /[؀-ۿ]/.test(tags.name) ? tags.name : null),
      operator: tags.operator ?? tags.brand ?? null,
      latitude: lat,
      longitude: lng,
      address: tags["addr:street"] ?? null,
      town: tags["addr:city"] ?? null,
      status: "UNKNOWN" as const,
      connectors: conns,
      maxPowerKw,
      totalPoints: Math.max(
        parseInt(tags.capacity ?? "", 10) || 0,
        conns.reduce((s, c) => s + c.quantity, 0),
        1
      ),
      pricing: tags.fee === "no" ? "Free" : (tags.charge ?? null),
      source: "OSM",
    };

    await prisma.station.upsert({
      where: { osmId },
      create: { osmId, ...data },
      update: data,
    });
    if (!alreadyImported) existing.push({ latitude: lat, longitude: lng, osmId });
    imported++;
  }
  return imported;
}
