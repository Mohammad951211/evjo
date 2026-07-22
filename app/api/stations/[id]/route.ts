import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Single station with full details, including the photo when present. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const station = await prisma.station.findUnique({ where: { id: params.id } });
  if (!station) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ station });
}
