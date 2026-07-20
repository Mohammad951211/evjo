"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MapPin, Navigation, Zap, Link2, ChevronLeft, ChevronRight,
  Calculator, Route, History, ArrowUpRight,
} from "lucide-react";
import { TariffCard } from "@/components/tariff-card";
import { LiveClock } from "@/components/live-clock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore, DEFAULT_CENTER } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { haversineKm, roadKm, driveMinutes } from "@/lib/geo";
import type { StationDto, GarageVehicle } from "@/types";

const NEARBY_RADIUS_KM = 10;

export default function HomePage() {
  const { t, locale, dir } = useI18n();
  const location = useAppStore((s) => s.location);
  const setLocation = useAppStore((s) => s.setLocation);
  const [stations, setStations] = useState<StationDto[]>([]);
  const [garage, setGarage] = useState<GarageVehicle[]>([]);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!location && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 8000 }
      );
    }
  }, [location, setLocation]);

  useEffect(() => {
    fetch("/api/stations").then((r) => r.json()).then((d) => setStations(d.stations ?? []));
    fetch("/api/garage").then((r) => r.json()).then((d) => setGarage(d.vehicles ?? []));
    fetch("/api/profile").then((r) => r.json()).then((d) => setUserName(d.user?.name?.split(" ")[0] ?? ""));
  }, []);

  const origin = location ?? DEFAULT_CENTER;
  const defaultVehicle = garage.find((v) => v.isDefault) ?? garage[0];

  const enriched = useMemo(
    () =>
      stations
        .map((s) => {
          const d = roadKm(haversineKm(origin.lat, origin.lng, s.latitude, s.longitude));
          return { ...s, distanceKm: d, driveMin: driveMinutes(d) };
        })
        .sort((a, b) => a.distanceKm - b.distanceKm),
    [stations, origin]
  );

  const nearbyCount = enriched.filter((s) => s.distanceKm! <= NEARBY_RADIUS_KM).length;

  const compatible = useMemo(() => {
    const fast = enriched.filter((s) => s.maxPowerKw >= 50);
    if (!defaultVehicle) return fast;
    const conn = defaultVehicle.spec.connector;
    return fast.filter((s) => (s.connectors ?? []).some((c) => c.type === conn));
  }, [enriched, defaultVehicle]);

  const recommended = compatible.find((s) => s.status !== "OFFLINE") ?? compatible[0];
  const name = (s: StationDto) => (locale === "ar" && s.nameAr ? s.nameAr : s.nameEn);
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div className="animate-slide-up">
      {/* Greeting + live date/time on one line */}
      <div className="flex items-start justify-between gap-3 pt-2">
        <div>
          <h1 className="text-xl font-bold">{t.greeting(userName)} 👋</h1>
          {defaultVehicle && (
            <p className="mt-1 text-sm text-muted-foreground">
              {defaultVehicle.spec.name}
              <Badge variant="outline" className="ms-2">{defaultVehicle.spec.connector}</Badge>
            </p>
          )}
          <Link
            href="/stations"
            className="mt-1 inline-block text-sm font-bold text-primary hover:underline"
          >
            {t.stationsWithin(nearbyCount, NEARBY_RADIUS_KM)}
          </Link>
        </div>
        <LiveClock />
      </div>

      <div className="mt-5 space-y-5">
        {/* ── Main column ─────────────────────────────── */}
        <div className="space-y-5">
          <TariffCard />

          {/* Stations near you */}
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-sm font-bold text-muted-foreground">{t.nearYou}</h2>
              <Link
                href="/stations"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                {t.viewMap}
                <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
              </Link>
            </div>
            {enriched.length === 0 ? (
              <p className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                {t.noStationsYet}
              </p>
            ) : (
              <div className="grid gap-3">
                {enriched.slice(0, 6).map((s) => (
                  <a
                    key={s.id}
                    href={`https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-2xl border bg-card p-4 transition-all card-shadow hover:-translate-y-0.5 hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-bold leading-snug">{name(s)}</p>
                      <Badge className="num shrink-0">{s.maxPowerKw} {t.kw}</Badge>
                    </div>
                    {s.operator && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{s.operator}</p>
                    )}
                    <div className="num mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {s.distanceKm!.toFixed(2)} {t.km}
                      </span>
                      <span>{s.driveMin} {t.min}</span>
                      <Navigation className="ms-auto h-3.5 w-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Aside column ────────────────────────────── */}
        <div className="space-y-5">
          {/* Fastest suitable option */}
          <section className="overflow-hidden rounded-2xl border bg-card card-shadow">
            <div className="border-b bg-accent/60 px-5 py-3">
              <p className="flex items-center gap-2 text-sm font-bold text-primary-dark" style={{ color: "#0C3B24" }}>
                <Zap className="h-4 w-4 text-primary" fill="currentColor" />
                {t.fastestOption}
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs text-muted-foreground">{t.fastestOptionBody}</p>
              {recommended ? (
                <>
                  <p className="mt-3 text-sm font-bold">{name(recommended)}</p>
                  <p className="num mt-1 text-xs text-muted-foreground">
                    {recommended.maxPowerKw} {t.kw} · {recommended.distanceKm!.toFixed(2)} {t.km} · {recommended.driveMin} {t.min}
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${recommended.latitude},${recommended.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block"
                  >
                    <Button className="w-full">
                      <Navigation />
                      {t.startNow}
                    </Button>
                  </a>
                </>
              ) : (
                <p className="mt-3 text-sm font-semibold text-muted-foreground">
                  {defaultVehicle ? t.noStationsYet : t.addVehicleFirst}
                </p>
              )}
            </div>
          </section>

          {/* Quick actions list */}
          <section className="divide-y rounded-2xl border bg-card card-shadow">
            {[
              { href: "/sessions?tab=new", icon: Link2, title: t.linkPromoTitle, sub: t.linkPromoBody },
              { href: "/calculator", icon: Calculator, title: t.calcTitle, sub: null },
              { href: "/trip", icon: Route, title: t.tripTitle, sub: null },
              { href: "/sessions", icon: History, title: t.sessionsTitle, sub: null },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-accent/50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  <a.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{a.title}</span>
                  {a.sub && (
                    <span className="mt-0.5 line-clamp-1 block text-[11px] text-muted-foreground">
                      {a.sub}
                    </span>
                  )}
                </span>
                <Chevron className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </Link>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
