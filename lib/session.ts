import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Returns the authenticated user id or null. */
export async function currentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

/** Returns the user id when the caller is an admin, otherwise null. */
export async function currentAdminId(): Promise<string | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const me = await prisma.user.findUnique({ where: { id: uid }, select: { isAdmin: true } });
  return me?.isAdmin ? uid : null;
}
