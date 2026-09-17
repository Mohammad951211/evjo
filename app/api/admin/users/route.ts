import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Registered-users list — admin only, paginated. Never returns password hashes. */
export async function GET(req: Request) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: uid },
    select: { isAdmin: true },
  });
  if (!me?.isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20));

  const [total, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        city: true,
        phoneVerified: true,
        isAdmin: true,
        onboarded: true,
        createdAt: true,
        _count: { select: { vehicles: true, sessions: true } },
      },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize,
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      city: u.city,
      phoneVerified: u.phoneVerified,
      isAdmin: u.isAdmin,
      onboarded: u.onboarded,
      createdAt: u.createdAt.toISOString(),
      vehicles: u._count.vehicles,
      sessions: u._count.sessions,
    })),
  });
}
