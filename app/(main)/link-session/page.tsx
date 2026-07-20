"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — the record-session form now lives in the charging hub. */
export default function LinkSessionPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/sessions?tab=new");
  }, [router]);
  return null;
}
