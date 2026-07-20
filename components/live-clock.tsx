"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/**
 * Live day / date / time, updating every second. Renders nothing until
 * mounted to avoid a server/client hydration mismatch on the clock.
 */
export function LiveClock() {
  const { locale } = useI18n();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <div className="h-10 w-32 animate-pulse rounded-xl bg-muted" />;
  }

  const loc = locale === "ar" ? "ar-JO" : "en-GB";
  const day = now.toLocaleDateString(loc, { weekday: "long" });
  const date = now.toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" });
  const time = now.toLocaleTimeString(loc, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-1.5 card-shadow">
      <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
      <div className="text-end leading-tight">
        <p className="text-xs font-bold text-foreground">{day}</p>
        <p className="num text-[11px] text-muted-foreground">{date}</p>
        <p className="num text-sm font-bold text-primary">{time}</p>
      </div>
    </div>
  );
}
