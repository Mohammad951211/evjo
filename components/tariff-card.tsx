"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { STATION_RATES, TOU_WINDOWS, type TouPeriod } from "@/config/tariffs";
import { periodAt, periodEndsAt } from "@/lib/tariff";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const PERIOD_STYLES: Record<
  TouPeriod,
  { text: string; chip: string; rail: string; barActive: string; barIdle: string }
> = {
  offpeak: {
    text: "text-[#1B7A4B]",
    chip: "bg-emerald-100 text-emerald-800",
    rail: "bg-[#1B7A4B]",
    barActive: "bg-[#1B7A4B]",
    barIdle: "bg-emerald-100",
  },
  partial: {
    text: "text-[#B45309]",
    chip: "bg-amber-100 text-amber-800",
    rail: "bg-[#B45309]",
    barActive: "bg-[#B45309]",
    barIdle: "bg-amber-100",
  },
  peak: {
    text: "text-[#BE123C]",
    chip: "bg-rose-100 text-rose-800",
    rail: "bg-[#BE123C]",
    barActive: "bg-[#BE123C]",
    barIdle: "bg-rose-100",
  },
};

function fmtTime(d: Date, locale: string) {
  return d.toLocaleTimeString(locale === "ar" ? "ar-JO" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Live station tariff panel: light card with a period-colored side rail,
 * the price tinted by the active time-of-use period, and a segmented
 * 24h schedule bar with a "now" marker.
 */
export function TariffCard() {
  const { t, locale } = useI18n();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  }

  const period = periodAt(now);
  const rate = STATION_RATES[period];
  const until = periodEndsAt(now);
  const s = PERIOD_STYLES[period];
  const periodLabel =
    period === "offpeak" ? t.periodOffpeak : period === "partial" ? t.periodPartial : t.periodPeak;
  const nowPct = ((now.getHours() * 60 + now.getMinutes()) / 1440) * 100;

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card card-shadow">
      {/* period accent rail */}
      <div className={cn("absolute inset-y-0 start-0 w-1.5", s.rail)} />

      <div className="flex flex-col gap-4 p-5 ps-6">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t.currentTariff} · {t.stationRatesLabel}
            </p>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={cn("num text-4xl font-bold leading-none", s.text)}>
              {rate.toFixed(3)}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">{t.jodPerKwh}</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.validUntil} <span className="num font-semibold text-foreground">{fmtTime(until, locale)}</span>
            {" · "}
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", s.chip)}>
              {periodLabel}
            </span>
          </p>
        </div>

        {/* 24h TOU bar */}
        <div dir="ltr">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {t.touScheduleToday}
            </span>
            <Zap className={cn("h-3.5 w-3.5", s.text)} fill="currentColor" />
          </div>
          <div className="relative mt-1.5 flex h-3 overflow-hidden rounded-full">
            {TOU_WINDOWS.slice()
              .sort((a, b) => a.from - b.from)
              .map((w, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-full",
                    w.period === period
                      ? PERIOD_STYLES[w.period].barActive
                      : PERIOD_STYLES[w.period].barIdle
                  )}
                  style={{ width: `${((w.to - w.from) / 24) * 100}%` }}
                  title={`${w.from}:00–${w.to}:00`}
                />
              ))}
            <div
              className="absolute top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-foreground shadow"
              style={{ left: `calc(${nowPct}% - 1.5px)` }}
              aria-label="now"
            />
          </div>
          <div className="num relative mt-1 h-3.5 text-[10px] font-medium text-muted-foreground">
            {[0, 5, 14, 17, 23].map((h) => (
              <span key={h} className="absolute -translate-x-1/2" style={{ left: `${(h / 24) * 100}%` }}>
                {h.toString().padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
