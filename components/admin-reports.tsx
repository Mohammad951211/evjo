"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag, Check, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";

interface Report {
  id: string;
  note: string | null;
  status: string;
  createdAt: string;
  station: { id: string; nameEn: string; nameAr: string | null };
  user: { name: string; phone: string | null };
}

/** Admin: community "station didn't work" reports. */
export function AdminReports() {
  const { t, locale } = useI18n();
  const [reports, setReports] = useState<Report[] | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then((d) => setReports(d.reports ?? []));
  }, []);

  useEffect(load, [load]);

  async function setStatus(id: string, status: "RESOLVED" | "OPEN") {
    await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/reports/${id}`, { method: "DELETE" });
    load();
  }

  const stationName = (s: Report["station"]) =>
    locale === "ar" && s.nameAr ? s.nameAr : s.nameEn;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (reports === null) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{t.loading}</p>;
  }
  if (reports.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
        {t.noReports}
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {reports.map((r) => (
        <div key={r.id} className="rounded-2xl border bg-card p-4 card-shadow">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-bold">
                <Flag className="h-3.5 w-3.5 shrink-0 text-destructive" />
                <span className="line-clamp-1">{stationName(r.station)}</span>
              </p>
              {r.note && <p className="mt-1 text-xs text-muted-foreground">"{r.note}"</p>}
              <p className="num mt-1 text-[11px] text-muted-foreground" dir="ltr">
                {r.user.phone ?? r.user.name} · {fmt(r.createdAt)}
              </p>
            </div>
            <Badge variant={r.status === "OPEN" ? "warning" : "success"} className="shrink-0">
              {r.status === "OPEN" ? t.reportOpen : t.reportResolved}
            </Badge>
          </div>
          <div className="mt-3 flex gap-2 border-t pt-3">
            {r.status === "OPEN" ? (
              <button
                onClick={() => setStatus(r.id, "RESOLVED")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/40 py-1.5 text-xs font-bold text-primary hover:bg-accent"
              >
                <Check className="h-3.5 w-3.5" />
                {t.resolveBtn}
              </button>
            ) : (
              <button
                onClick={() => setStatus(r.id, "OPEN")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t.reopenBtn}
              </button>
            )}
            <button
              onClick={() => remove(r.id)}
              aria-label={t.delete}
              className="rounded-lg border border-destructive/30 px-3 py-1.5 text-destructive hover:bg-destructive/5"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
