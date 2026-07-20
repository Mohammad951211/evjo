import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";
import { computeChargeCost, type RateContext } from "@/lib/tariff";

export const dynamic = "force-dynamic";

export async function GET() {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const list = await prisma.chargingSession.findMany({
    where: { userId: uid },
    include: {
      station: { select: { nameEn: true, nameAr: true } },
      userVehicle: { include: { vehicle: { select: { make: true, model: true } } } },
    },
    orderBy: { startedAt: "desc" },
    take: 200,
  });

  const sessions = list.map((s) => ({
    id: s.id,
    locationType: s.locationType,
    stationName: s.station ? (s.station.nameAr ?? s.station.nameEn) : null,
    vehicleName: s.userVehicle
      ? s.userVehicle.vehicle
        ? `${s.userVehicle.vehicle.make} ${s.userVehicle.vehicle.model}`
        : s.userVehicle.customName
      : null,
    startedAt: s.startedAt.toISOString(),
    kwh: s.kwh,
    costJod: s.costJod,
    durationMin: s.durationMin,
  }));

  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const kwh = Number(body?.kwh);
  if (!body || !kwh || kwh <= 0) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const locationType = body.locationType === "HOME" ? "HOME" : "STATION";

  // verify ownership / existence of references
  let userVehicle = null;
  if (body.userVehicleId) {
    userVehicle = await prisma.userVehicle.findFirst({
      where: { id: String(body.userVehicleId), userId: uid },
      include: { vehicle: true },
    });
  }
  let stationId: string | null = null;
  if (locationType === "STATION" && body.stationId) {
    const st = await prisma.station.findUnique({ where: { id: String(body.stationId) } });
    stationId = st?.id ?? null;
  }

  const startedAt = body.startedAt ? new Date(body.startedAt) : new Date();
  let costJod = Number(body.costJod) > 0 ? Math.round(Number(body.costJod) * 1000) / 1000 : 0;
  let durationMin = body.durationMin ? Math.round(Number(body.durationMin)) : null;

  // Cost is always stored in JOD. When the client doesn't supply a
  // pre-computed figure, price the session server-side with the TOU
  // tariff engine (splitting across period boundaries).
  if (costJod === 0) {
    const user = await prisma.user.findUnique({ where: { id: uid } });
    let powerKw: number;
    let ctx: RateContext;
    if (locationType === "STATION") {
      powerKw = userVehicle?.vehicle?.dcKw ?? userVehicle?.customDcKw ?? 60;
      ctx = { location: "station" };
    } else {
      powerKw = user?.homeChargerKw ?? 7.4;
      ctx =
        user?.meterType === "SERVICES_METER"
          ? { location: "home", meterType: "SERVICES_METER", tier: user.servicesTier ?? 2 }
          : { location: "home", meterType: "EV_METER" };
    }
    const priced = computeChargeCost({
      kwhNeeded: kwh,
      powerKw: Math.max(powerKw, 1),
      start: startedAt,
      ctx,
    });
    costJod = priced.totalCost;
    durationMin = durationMin ?? priced.durationMin;
  }

  const session = await prisma.chargingSession.create({
    data: {
      userId: uid,
      userVehicleId: userVehicle?.id ?? null,
      stationId,
      locationType,
      startedAt,
      kwh: Math.round(kwh * 100) / 100,
      costJod,
      durationMin,
    },
  });

  return NextResponse.json({ id: session.id, costJod }, { status: 201 });
}
