import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdminId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Station problem reports — admin only, newest first. */
export async function GET() {
  const admin = await currentAdminId();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const reports = await prisma.stationReport.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      station: { select: { id: true, nameEn: true, nameAr: true, source: true } },
      user: { select: { name: true, phone: true } },
    },
  });

  return NextResponse.json({
    reports: reports.map((r) => ({
      id: r.id,
      note: r.note,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      station: r.station,
      user: r.user,
    })),
  });
}
