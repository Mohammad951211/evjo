import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";
import { JO_CITIES } from "@/lib/geo";
import { planTrip, type TripVehicle } from "@/lib/trip";

export async function POST(req: Request) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const origin = JO_CITIES.find((c) => c.id === body.originId);
  const destination = JO_CITIES.find((c) => c.id === body.destinationId);
  if (!origin || !destination || origin.id === destination.id) {
    return NextResponse.json({ error: "invalid route" }, { status: 400 });
  }

  const uv = await prisma.userVehicle.findFirst({
    where: { id: String(body.userVehicleId), userId: uid },
    include: { vehicle: true },
  });
  if (!uv) return NextResponse.json({ error: "vehicle not found" }, { status: 404 });

  const vehicle: TripVehicle = uv.vehicle
    ? {
        usableKwh: uv.vehicle.usableKwh,
        consumption: uv.vehicle.consumption,
        dcKw: uv.vehicle.dcKw,
        connector: uv.vehicle.connector,
      }
    : {
        usableKwh: uv.customUsable ?? uv.customBattery ?? 50,
        consumption: uv.customConsumption ?? 16,
        dcKw: uv.customDcKw ?? 50,
        connector: uv.customConnector ?? "CCS2",
      };

  const stations = await prisma.station.findMany({
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      latitude: true,
      longitude: true,
      maxPowerKw: true,
      status: true,
      connectors: true,
    },
  });

  const plan = planTrip({
    origin,
    destination,
    vehicle,
    startSocPct: Math.min(100, Math.max(1, Number(body.startSocPct) || 80)),
    arrivalTargetPct: Math.min(60, Math.max(5, Number(body.arrivalTargetPct) || 20)),
    climateLoad: Boolean(body.climateLoad),
    stations: stations.map((s) => ({
      ...s,
      connectors: (s.connectors as { type: string; powerKw: number; quantity: number }[]) ?? [],
    })),
    localeAr: body.locale === "ar",
  });

  return NextResponse.json({ plan });
}
