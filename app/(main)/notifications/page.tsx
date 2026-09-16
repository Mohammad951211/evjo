"use client";

import { useEffect, useState } from "react";
import { Bell, Moon, Zap, WifiOff, Tag } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { periodAt } from "@/lib/tariff";

interface ServerNotif {
  id: string;
  type: "STATION_OFFLINE" | "STATION_PRICE";
  stationNameEn: string;
  stationNameAr: string | null;
  oldValue: string | null;
  newValue: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { t, locale } = useI18n();
  const [period, setPeriod] = useState<string | null>(null);
  const [server, setServer] = useState<ServerNotif[]>([]);

  useEffect(() => {
    setPeriod(periodAt(new Date()));
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : { notifications: [] }))
      .then((d) => setServer(d.notifications ?? []))
      .catch(() => {});
    // opening the page clears the unread state
    fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
  }, []);

  const stationName = (n: ServerNotif) =>
    locale === "ar" && n.stationNameAr ? n.stationNameAr : n.stationNameEn;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const computed = [
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
        {/* Server alerts: favorited station offline / price change */}
        {server.map((n) => {
          const Icon = n.type === "STATION_OFFLINE" ? WifiOff : Tag;
          const text =
            n.type === "STATION_OFFLINE"
              ? t.notifStationOffline(stationName(n))
              : t.notifStationPrice(stationName(n));
          return (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 text-sm font-medium ${
                n.type === "STATION_OFFLINE"
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-amber-200 bg-amber-50 text-amber-900"
              } ${!n.read ? "ring-1 ring-primary/30" : ""}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p>{text}</p>
                  {n.type === "STATION_PRICE" && (n.oldValue || n.newValue) && (
                    <p className="num mt-1 text-[11px] opacity-80" dir="ltr">
                      {n.oldValue ?? "—"} → {n.newValue ?? "—"}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] opacity-70">{fmtDate(n.createdAt)}</p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Time-of-use reminders (computed) */}
        {computed.map((n, i) => (
          <div key={i} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium ${n.tone}`}>
            <n.icon className="mt-0.5 h-4 w-4 shrink-0" />
            {n.text}
          </div>
        ))}
      </div>
    </div>
  );
}
