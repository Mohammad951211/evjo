import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Returns the authenticated user id or null. */
export async function currentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}
