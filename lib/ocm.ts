import { prisma } from "@/lib/prisma";
import { StationStatus } from "@prisma/client";

/** OCM connection type ids we can classify. */
const CONNECTION_IDS: Record<number, string> = {
  33: "CCS2", // CCS (Type 2)
  2: "CHADEMO",
  1036: "GBT_DC",
  1038: "GBT_DC",
  25: "TYPE2", // Type 2 socket
  1: "TYPE2", // Type 1 — grouped as AC
};

interface OcmConnection {
  ConnectionTypeID?: number;
  ConnectionType?: { ID?: number; Title?: string };
  PowerKW?: number;
  Quantity?: number;
}

interface OcmPoi {
  ID: number;
  AddressInfo?: {
    Title?: string;
    AddressLine1?: string;
    Town?: string;
    Latitude?: number;
    Longitude?: number;
  };
  OperatorInfo?: { Title?: string };
  StatusType?: { IsOperational?: boolean; Title?: string };
  Connections?: OcmConnection[];
  UsageCost?: string;
  NumberOfPoints?: number;
}

function connectorName(c: OcmConnection): string | null {
  const id = c.ConnectionTypeID ?? c.ConnectionType?.ID;
  if (id && CONNECTION_IDS[id]) return CONNECTION_IDS[id];
  const title = c.ConnectionType?.Title?.toLowerCase() ?? "";
  if (title.includes("ccs")) return "CCS2";
  if (title.includes("chademo")) return "CHADEMO";
  if (title.includes("gb") && title.includes("dc")) return "GBT_DC";
  if (title.includes("type 2") || title.includes("mennekes")) return "TYPE2";
  return null;
}

/**
 * Fetches every Jordan POI from OpenChargeMap and upserts all of them —
 * DC fast and AC alike. The UI distinguishes fast (≥50 kW) visually.
 * Returns the number imported.
 */
export async function refreshStationsFromOcm(): Promise<number> {
  const key = process.env.OCM_API_KEY;
  const url = new URL("https://api.openchargemap.io/v3/poi/");
  url.searchParams.set("output", "json");
  url.searchParams.set("countrycode", "JO");
  url.searchParams.set("maxresults", "500");
  if (key) url.searchParams.set("key", key);

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "EVJO/1.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`OpenChargeMap responded ${res.status}`);
  const pois = (await res.json()) as OcmPoi[];

  let imported = 0;
  for (const poi of pois) {
    const lat = poi.AddressInfo?.Latitude;
    const lng = poi.AddressInfo?.Longitude;
    if (lat == null || lng == null) continue;

    const conns = (poi.Connections ?? [])
      .map((c) => ({
        type: connectorName(c),
        powerKw: c.PowerKW ?? 0,
        quantity: c.Quantity ?? 1,
      }))
      .filter((c) => c.type !== null) as {
      type: string;
      powerKw: number;
      quantity: number;
    }[];

    const maxPowerKw = conns.length ? Math.max(...conns.map((c) => c.powerKw)) : 0;
    const status: StationStatus =
      poi.StatusType?.IsOperational === true
        ? "OPERATIONAL"
        : poi.StatusType?.IsOperational === false
          ? "OFFLINE"
          : "UNKNOWN";

    const data = {
      nameEn: poi.AddressInfo?.Title ?? `Station ${poi.ID}`,
      operator: poi.OperatorInfo?.Title ?? null,
      latitude: lat,
      longitude: lng,
      address: poi.AddressInfo?.AddressLine1 ?? null,
      town: poi.AddressInfo?.Town ?? null,
      status,
      connectors: conns,
      maxPowerKw,
      totalPoints: poi.NumberOfPoints ?? Math.max(1, conns.reduce((s, c) => s + c.quantity, 0)),
      pricing: poi.UsageCost ?? null,
      source: "OCM",
    };

    await prisma.station.upsert({
      where: { ocmId: poi.ID },
      create: { ocmId: poi.ID, ...data },
      update: data,
    });
    imported++;
  }
  return imported;
}
