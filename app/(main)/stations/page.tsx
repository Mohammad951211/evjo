"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Navigation, X, RefreshCw, Search, MapPin } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore, DEFAULT_CENTER } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { haversineKm, roadKm, driveMinutes } from "@/lib/geo";
import type { StationDto, GarageVehicle } from "@/types";

const StationMap = dynamic(() => import("@/components/station-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

const CONNECTOR_LABEL: Record<string, string> = {
  CCS2: "CCS2",
  CHADEMO: "CHAdeMO",
  GBT_DC: "GB/T DC",
};

export default function StationsPage() {
  const { t, locale } = useI18n();
  const location = useAppStore((s) => s.location);
  const [stations, setStations] = useState<StationDto[]>([]);
  const [garage, setGarage] = useState<GarageVehicle[]>([]);
  const [selected, setSelected] = useState<StationDto | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [connFilter, setConnFilter] = useState("all");
  const [powerFilter, setPowerFilter] = useState("all");
  const [operatorFilter, setOperatorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const origin = location ?? DEFAULT_CENTER;

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((d) => setStations(d.stations ?? []));
    fetch("/api/garage")
      .then((r) => r.json())
      .then((d) => setGarage(d.vehicles ?? []));
  }, []);

  const operators = useMemo(
    () => Array.from(new Set(stations.map((s) => s.operator).filter(Boolean))) as string[],
    [stations]
  );

  const enriched = useMemo(
    () =>
      stations
        .map((s) => {
          const d = roadKm(haversineKm(origin.lat, origin.lng, s.latitude, s.longitude));
          return { ...s, distanceKm: d, driveMin: driveMinutes(d) };
        })
        .sort((a, b) => a.distanceKm! - b.distanceKm!),
    [stations, origin]
  );

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      enriched.filter((s) => {
        if (connFilter !== "all" && !s.connectors.some((c) => c.type === connFilter)) return false;
        if (powerFilter === "50" && s.maxPowerKw < 50) return false;
        if (powerFilter === "100" && s.maxPowerKw < 100) return false;
        if (powerFilter === "150" && s.maxPowerKw < 150) return false;
        if (operatorFilter !== "all" && s.operator !== operatorFilter) return false;
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (q) {
          const hay = [s.nameEn, s.nameAr, s.operator, s.town, s.address]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      }),
    [enriched, connFilter, powerFilter, operatorFilter, statusFilter, q]
  );

  // top matches for the search dropdown
  const searchResults = useMemo(
    () => (q ? filtered.slice(0, 8) : []),
    [filtered, q]
  );

  const defaultVehicle = garage.find((v) => v.isDefault) ?? garage[0];
  const nearestCompatible = useMemo(() => {
    const fast = filtered.filter((s) => s.maxPowerKw >= 50);
    if (!defaultVehicle) return fast[0] ?? null;
    return (
      fast.find(
        (s) =>
          s.status !== "OFFLINE" &&
          s.connectors.some((c) => c.type === defaultVehicle.spec.connector)
      ) ?? null
    );
  }, [filtered, defaultVehicle]);

  async function refresh() {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const res = await fetch("/api/stations/refresh", { method: "POST" });
      const d = await res.json();
      if (res.ok) {
        setRefreshMsg(t.refreshed(d.imported ?? 0));
        const list = await fetch("/api/stations").then((r) => r.json());
        setStations(list.stations ?? []);
      } else {
        setRefreshMsg(d.error ?? "Error");
      }
    } catch {
      setRefreshMsg("Error");
    } finally {
      setRefreshing(false);
    }
  }

  const name = (s: StationDto) => (locale === "ar" && s.nameAr ? s.nameAr : s.nameEn);

  function pickStation(s: StationDto) {
    setMapCenter([s.latitude, s.longitude]);
    setSelected(s);
    setQuery("");
    setSearchFocused(false);
  }

  return (
    <div className="animate-slide-up pt-2">
      <div className="pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">{t.stationsTitle}</h1>
          <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={refreshing ? "animate-spin" : ""} />
            {t.refreshStations}
          </Button>
        </div>
        {refreshMsg && <p className="mt-1 text-xs font-semibold text-primary">{refreshMsg}</p>}

        {/* Search */}
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder={t.searchStations}
            className="h-11 ps-10"
            aria-label={t.searchStations}
          />
          {query && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setQuery("")}
              aria-label={t.cancel}
              className="absolute top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted ltr:right-2 rtl:left-2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {searchFocused && searchResults.length > 0 && (
            <div className="absolute inset-x-0 top-12 z-[1000] overflow-hidden rounded-xl border bg-card card-shadow">
              {searchResults.map((s) => (
                <button
                  key={s.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickStation(s)}
                  className="flex w-full items-center gap-3 border-b px-3 py-2.5 text-start last:border-b-0 hover:bg-accent"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-semibold">{name(s)}</span>
                    <span className="line-clamp-1 text-[11px] text-muted-foreground">
                      {[s.operator, s.town].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="num shrink-0 text-xs font-bold text-primary">
                    {s.distanceKm!.toFixed(1)} {t.km}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Select value={connFilter} onChange={(e) => setConnFilter(e.target.value)} className="h-9 text-xs">
            <option value="all">{t.filterConnector}: {t.allF}</option>
            <option value="CCS2">CCS2</option>
            <option value="CHADEMO">CHAdeMO</option>
            <option value="GBT_DC">GB/T DC</option>
            <option value="TYPE2">Type 2 (AC)</option>
          </Select>
          <Select value={powerFilter} onChange={(e) => setPowerFilter(e.target.value)} className="h-9 text-xs">
            <option value="all">{t.filterPower}: {t.allF}</option>
            <option value="50">50+ kW</option>
            <option value="100">100+ kW</option>
            <option value="150">150+ kW</option>
          </Select>
          <Select value={operatorFilter} onChange={(e) => setOperatorFilter(e.target.value)} className="h-9 text-xs">
            <option value="all">{t.filterOperator}: {t.allF}</option>
            {operators.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 text-xs">
            <option value="all">{t.filterStatus}: {t.allF}</option>
            <option value="OPERATIONAL">{t.operational}</option>
            <option value="OFFLINE">{t.offline}</option>
            <option value="UNKNOWN">{t.unknown}</option>
          </Select>
        </div>

        {nearestCompatible && (
          <button
            onClick={() => setSelected(nearestCompatible)}
            className="mt-3 flex w-full items-center justify-between rounded-xl border border-primary/30 bg-accent px-4 py-2.5 text-start"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                {t.nearestCompatible}
              </p>
              <p className="line-clamp-1 text-sm font-semibold">{name(nearestCompatible)}</p>
            </div>
            <p className="num shrink-0 text-sm font-bold text-primary">
              {nearestCompatible.distanceKm!.toFixed(2)} {t.km} · {nearestCompatible.driveMin} {t.min}
            </p>
          </button>
        )}
      </div>

      {/* Map */}
      <div className="relative h-[52dvh] min-h-[340px] overflow-hidden rounded-2xl border card-shadow">
        <StationMap
          center={mapCenter ?? [origin.lat, origin.lng]}
          userLocation={location ? [location.lat, location.lng] : null}
          stations={filtered}
          highlightedId={selected?.id ?? nearestCompatible?.id}
          onSelect={(s) => {
            setMapCenter([s.latitude, s.longitude]);
            setSelected(s);
          }}
        />
      </div>

      {/* Detail sheet */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-md animate-slide-up rounded-t-3xl bg-card p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">{name(selected)}</h2>
                {selected.operator && (
                  <p className="text-xs text-muted-foreground">{selected.operator}</p>
                )}
                {(selected.address || selected.town) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[selected.address, selected.town].filter(Boolean).join("، ")}
                  </p>
                )}
              </div>
              <button onClick={() => setSelected(null)} aria-label={t.cancel} className="rounded-full p-1.5 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={selected.status === "OPERATIONAL" ? "success" : selected.status === "OFFLINE" ? "danger" : "secondary"}>
                {selected.status === "OPERATIONAL" ? t.operational : selected.status === "OFFLINE" ? t.offline : t.unknown}
              </Badge>
              <Badge variant="default" className="num">{selected.maxPowerKw} {t.kw}</Badge>
              <Badge variant="secondary" className="num">{selected.totalPoints} × {t.chargingPoints}</Badge>
            </div>

            <div className="mt-4 rounded-xl bg-muted/60 p-3">
              <p className="mb-2 text-xs font-bold text-muted-foreground">{t.connectors}</p>
              {selected.connectors.length > 0 ? (
                <div className="space-y-1.5">
                  {selected.connectors.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{CONNECTOR_LABEL[c.type] ?? c.type}</span>
                      <span className="num text-muted-foreground">
                        {c.quantity} × {c.powerKw > 0 ? `${c.powerKw} ${t.kw}` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t.noConnectorInfo}</p>
              )}
              {selected.pricing && (
                <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">
                  {t.pricingInfo}: {selected.pricing}
                </p>
              )}
            </div>

            <div className="num mt-3 flex justify-between text-sm text-muted-foreground">
              <span>{t.distance}: <b className="text-foreground">{selected.distanceKm!.toFixed(2)} {t.km}</b></span>
              <span>{t.driveTime}: <b className="text-foreground">{selected.driveMin} {t.min}</b></span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="num" dir="ltr">{selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}</span>
              {selected.source && <span>{t.dataSource}: {selected.source}</span>}
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block"
            >
              <Button className="w-full" size="lg">
                <Navigation />
                {t.navigate}
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
