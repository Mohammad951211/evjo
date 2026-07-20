import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const uv = await prisma.userVehicle.findFirst({ where: { id: params.id, userId: uid } });
  if (!uv) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  if (body.isDefault === true) {
    await prisma.$transaction([
      prisma.userVehicle.updateMany({ where: { userId: uid }, data: { isDefault: false } }),
      prisma.userVehicle.update({ where: { id: uv.id }, data: { isDefault: true } }),
    ]);
  }
  if (typeof body.nickname === "string") {
    await prisma.userVehicle.update({ where: { id: uv.id }, data: { nickname: body.nickname } });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const uv = await prisma.userVehicle.findFirst({ where: { id: params.id, userId: uid } });
  if (!uv) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.userVehicle.delete({ where: { id: uv.id } });

  // keep exactly one default
  if (uv.isDefault) {
    const next = await prisma.userVehicle.findFirst({
      where: { userId: uid },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.userVehicle.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }
  return NextResponse.json({ ok: true });
}
