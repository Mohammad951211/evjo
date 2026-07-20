import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/session";

export default async function RootPage() {
  const uid = await currentUserId();
  redirect(uid ? "/home" : "/login");
}
