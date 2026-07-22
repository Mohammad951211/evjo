import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdminId } from "@/lib/session";

export const dynamic = "force-dynamic";

const CONNECTOR_TYPES = ["CCS2", "CHADEMO", "GBT_DC", "TYPE2"];

/**
 * Extracts lat/lng from free text: "31.95, 35.91", a full Google Maps URL
 * (…@31.95,35.91… or ?q=31.95,35.91), or a maps.app.goo.gl short link
 * (resolved by following its redirect).
 */
async function parseLocation(input: string): Promise<{ lat: number; lng: number } | null> {
  let s = input.trim();

  // short link → follow the redirect to the full URL
  if (/^(https?:\/\/)?(maps\.app\.goo\.gl|goo\.gl)\//i.test(s)) {
    try {
      const url = s.startsWith("http") ? s : `https://${s}`;
      const res = await fetch(url, { method: "GET", redirect: "follow", cache: "no-store" });
      s = res.url || s;
    } catch {
      /* fall through to regex attempts on the original string */
    }
  }

  const patterns = [
    /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/, // …/@31.95,35.91,15z
    /[?&]q=(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/, // ?q=31.95,35.91
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/, // place pin !3d..!4d..
    /(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/, // bare "31.95, 35.91"
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  }
  return null;
}

/** Manually added stations (source MANUAL) — admin only. */
export async function GET() {
  const admin = await currentAdminId();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const stations = await prisma.station.findMany({
    where: { source: "MANUAL" },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ stations });
}

/** Add a station by hand. Manual stations persist across data refreshes. */
export async function POST(req: Request) {
  const admin = await currentAdminId();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const locationText = String(body?.location ?? "").trim();
  if (!name || !locationText) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const coords = await parseLocation(locationText);
  if (!coords) {
    return NextResponse.json({ error: "bad_location" }, { status: 400 });
  }
  // sanity: inside Jordan's bounding box
  if (coords.lat < 29.1 || coords.lat > 33.5 || coords.lng < 34.8 || coords.lng > 39.4) {
    return NextResponse.json({ error: "out_of_bounds" }, { status: 400 });
  }

  const connector = CONNECTOR_TYPES.includes(body?.connector?.type)
    ? {
        type: String(body.connector.type),
        powerKw: Math.max(0, Number(body.connector.powerKw) || 0),
        quantity: Math.max(1, Math.round(Number(body.connector.quantity) || 1)),
      }
    : null;

  // optional photo: compressed data-URL from the client, hard-capped
  let image: string | null = null;
  if (typeof body?.image === "string" && body.image.length > 0) {
    if (
      !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(body.image) ||
      body.image.length > 1_200_000
    ) {
      return NextResponse.json({ error: "bad_image" }, { status: 400 });
    }
    image = body.image;
  }

  const station = await prisma.station.create({
    data: {
      image,
      nameEn: name,
      nameAr: /[؀-ۿ]/.test(name) ? name : null,
      operator: body?.operator ? String(body.operator).trim() : null,
      town: body?.town ? String(body.town).trim() : null,
      latitude: coords.lat,
      longitude: coords.lng,
      status: "OPERATIONAL",
      connectors: connector ? [connector] : [],
      maxPowerKw: connector?.powerKw ?? 0,
      totalPoints: connector?.quantity ?? 1,
      source: "MANUAL",
    },
  });

  return NextResponse.json({ station }, { status: 201 });
}
