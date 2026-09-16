import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** The signed-in user's in-app notifications (newest first) + unread count. */
export async function GET() {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({ where: { userId: uid, read: false } }),
  ]);

  return NextResponse.json({ notifications, unread });
}

/** Mark all of the user's notifications as read (called when they open the page). */
export async function PATCH() {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId: uid, read: false },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
