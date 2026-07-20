"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Zap, Home as HomeIcon, PlugZap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionForm } from "@/components/session-form";
import { useI18n } from "@/lib/i18n";
import type { SessionDto } from "@/types";

function SessionsInner() {
  const { t, locale } = useI18n();
  const params = useSearchParams();
  const [tab, setTab] = useState<"history" | "new">(
    params.get("tab") === "new" ? "new" : "history"
  );
  const [sessions, setSessions] = useState<SessionDto[] | null>(null);

  const load = useCallback(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []));
  }, []);

  useEffect(load, [load]);

  const yearly = useMemo(() => {
    if (!sessions) return [];
    const map = new Map<number, { kwh: number; cost: number; count: number }>();
    for (const s of sessions) {
      const y = new Date(s.startedAt).getFullYear();
      const cur = map.get(y) ?? { kwh: 0, cost: 0, count: 0 };
      cur.kwh += s.kwh;
      cur.cost += s.costJod;
      cur.count++;
      map.set(y, cur);
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [sessions]);

  const monthly = useMemo(() => {
    if (!sessions) return [];
    const map = new Map<string, { kwh: number; cost: number; count: number }>();
    for (const s of sessions) {
      const d = new Date(s.startedAt);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      const cur = map.get(key) ?? { kwh: 0, cost: 0, count: 0 };
      cur.kwh += s.kwh;
      cur.cost += s.costJod;
      cur.count++;
      map.set(key, cur);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [sessions]);

  const fmtMonth = (key: string) => {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-GB", {
      month: "long",
      year: "numeric",
    });
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="animate-slide-up pt-2">
      <h1 className="flex items-center gap-2 text-lg font-bold">
        <Zap className="h-5 w-5 text-primary" fill="currentColor" />
        {t.navCharging}
      </h1>

      {/* Tabs */}
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        {(["history", "new"] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`rounded-lg py-2 text-sm font-bold transition-colors ${
              tab === tb ? "bg-card text-primary card-shadow" : "text-muted-foreground"
            }`}
          >
            {tb === "history" ? t.sessionsTitle : t.newSession}
          </button>
        ))}
      </div>

      {tab === "new" ? (
        <div className="mt-4">
          <SessionForm
            onSaved={() => {
              setTab("history");
              load();
            }}
          />
        </div>
      ) : sessions === null ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed py-14 text-center text-sm text-muted-foreground">
          {t.noSessions}
        </p>
      ) : (
        <>
          {/* Yearly totals */}
          <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(yearly.length, 2)}, minmax(0, 1fr))` }}>
            {yearly.map(([year, ytd]) => (
              <div key={year} className="rounded-2xl bg-primary p-4 text-primary-foreground card-shadow">
                <p className="text-[11px] font-bold uppercase tracking-wide text-primary-foreground/70">
                  {t.yearTotal(year)}
                </p>
                <p className="num mt-1 text-2xl font-bold leading-none">
                  {ytd.cost.toFixed(2)} <span className="text-sm font-semibold">{t.jod}</span>
                </p>
                <p className="num mt-1.5 text-xs text-primary-foreground/75">
                  {ytd.kwh.toFixed(1)} {t.kwh} · {t.sessionsCount(ytd.count)}
                </p>
              </div>
            ))}
          </div>

          {/* Monthly totals */}
          <Card className="mt-3">
            <CardContent className="pt-5">
              <p className="mb-3 text-xs font-bold text-muted-foreground">{t.monthlyTotals}</p>
              <div className="space-y-2">
                {monthly.map(([key, m]) => (
                  <div key={key} className="flex items-center justify-between rounded-xl bg-accent px-4 py-2.5 text-sm">
                    <div>
                      <p className="font-bold">{fmtMonth(key)}</p>
                      <p className="text-[11px] text-muted-foreground">{t.sessionsCount(m.count)}</p>
                    </div>
                    <div className="num text-end">
                      <p className="font-bold text-primary">{m.cost.toFixed(2)} {t.jod}</p>
                      <p className="text-[11px] text-muted-foreground">{m.kwh.toFixed(1)} {t.kwh}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Session list */}
          <div className="mt-3 space-y-2.5">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 card-shadow">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
                  {s.locationType === "HOME" ? (
                    <HomeIcon className="h-5 w-5 text-primary" />
                  ) : (
                    <PlugZap className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold">
                    {s.locationType === "HOME" ? t.home : (s.stationName ?? t.station)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {fmtDate(s.startedAt)}
                    {s.vehicleName ? ` · ${s.vehicleName}` : ""}
                  </p>
                </div>
                <div className="num shrink-0 text-end">
                  <p className="text-sm font-bold text-primary">{s.costJod.toFixed(3)} {t.jod}</p>
                  <p className="text-[11px] text-muted-foreground">{s.kwh.toFixed(1)} {t.kwh}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SessionsPage() {
  return (
    <Suspense fallback={null}>
      <SessionsInner />
    </Suspense>
  );
}
