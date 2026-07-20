"use client";

import { useEffect, useState } from "react";
import { Bell, Moon, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { periodAt } from "@/lib/tariff";

export default function NotificationsPage() {
  const { t } = useI18n();
  const [period, setPeriod] = useState<string | null>(null);

  useEffect(() => {
    setPeriod(periodAt(new Date()));
  }, []);

  const items = [
    ...(period === "peak"
      ? [{ icon: Zap, text: t.notifPeakNow, tone: "bg-rose-50 text-rose-800 border-rose-200" }]
      : []),
    { icon: Moon, text: t.notifOffpeakSoon, tone: "bg-accent text-primary-dark border-primary/20" },
    { icon: Bell, text: t.notifWelcome, tone: "bg-card text-foreground border-border" },
  ];

  return (
    <div className="animate-slide-up pt-2">
      <h1 className="flex items-center gap-2 text-lg font-bold">
        <Bell className="h-5 w-5 text-primary" />
        {t.notificationsTitle}
      </h1>

      <div className="mt-4 space-y-2.5">
        {items.map((n, i) => (
          <div key={i} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium ${n.tone}`}>
            <n.icon className="mt-0.5 h-4 w-4 shrink-0" />
            {n.text}
          </div>
        ))}
      </div>
    </div>
  );
}
