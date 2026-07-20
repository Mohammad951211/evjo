import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";
import type { GarageVehicle } from "@/types";

export const dynamic = "force-dynamic";

function toDto(uv: any): GarageVehicle {
  const v = uv.vehicle;
  return {
    id: uv.id,
    nickname: uv.nickname,
    year: uv.year,
    isDefault: uv.isDefault,
    spec: v
      ? {
          name: `${v.make} ${v.model} ${v.variant}`,
          make: v.make,
          batteryKwh: v.batteryKwh,
          usableKwh: v.usableKwh,
          rangeKm: v.rangeKm,
          consumption: v.consumption,
          dcKw: v.dcKw,
          acKw: v.acKw,
          connector: v.connector,
          image: v.image,
        }
      : {
          name: uv.customName ?? "Custom EV",
          make: "Custom",
          batteryKwh: uv.customBattery ?? 0,
          usableKwh: uv.customUsable ?? uv.customBattery ?? 0,
          rangeKm:
            uv.customBattery && uv.customConsumption
              ? Math.round(((uv.customUsable ?? uv.customBattery) / uv.customConsumption) * 100)
              : null,
          consumption: uv.customConsumption ?? 0,
          dcKw: uv.customDcKw ?? 0,
          acKw: null,
          connector: uv.customConnector ?? "CCS2",
          image: null,
        },
  };
}

export async function GET() {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const list = await prisma.userVehicle.findMany({
    where: { userId: uid },
    include: { vehicle: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ vehicles: list.map(toDto) });
}

export async function POST(req: Request) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const count = await prisma.userVehicle.count({ where: { userId: uid } });

  let created;
  if (body.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: String(body.vehicleId) } });
    if (!vehicle) return NextResponse.json({ error: "vehicle not found" }, { status: 404 });
    created = await prisma.userVehicle.create({
      data: {
        userId: uid,
        vehicleId: vehicle.id,
        year: body.year ? Number(body.year) : null,
        isDefault: count === 0,
      },
      include: { vehicle: true },
    });
  } else if (body.custom) {
    const c = body.custom;
    if (!c.name || !Number(c.batteryKwh) || !Number(c.consumption)) {
      return NextResponse.json({ error: "invalid custom vehicle" }, { status: 400 });
    }
    created = await prisma.userVehicle.create({
      data: {
        userId: uid,
        customName: String(c.name),
        customBattery: Number(c.batteryKwh),
        customUsable: Number(c.usableKwh ?? c.batteryKwh),
        customConsumption: Number(c.consumption),
        customDcKw: Number(c.dcKw ?? 50),
        customConnector: ["CCS2", "GBT_DC", "CHADEMO", "TYPE2"].includes(c.connector)
          ? c.connector
          : "CCS2",
        isDefault: count === 0,
      },
      include: { vehicle: true },
    });
  } else {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  return NextResponse.json({ vehicle: toDto(created) }, { status: 201 });
}
