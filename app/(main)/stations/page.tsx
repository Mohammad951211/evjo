"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Navigation, X, RefreshCw, Search, MapPin, SlidersHorizontal, Crosshair,
  LocateFixed, Gauge, Star, Share2, Copy, Flag,
} from "lucide-react";
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
  const setLocation = useAppStore((s) => s.setLocation);
  const [stations, setStations] = useState<StationDto[]>([]);
  const [garage, setGarage] = useState<GarageVehicle[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [favOnly, setFavOnly] = useState(false);
  const [rangeSoc, setRangeSoc] = useState<number | null>(null);
  const [rangePanel, setRangePanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportMode, setReportMode] = useState(false);
  const [reportNote, setReportNote] = useState("");
  const [reportDone, setReportDone] = useState(false);
  const [selected, setSelected] = useState<StationDto | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
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
    fetch("/api/favorites")
      .then((r) => (r.ok ? r.json() : { ids: [] }))
      .then((d) => setFavIds(new Set(d.ids ?? [])))
      .catch(() => {});
  }, []);

  // photo is heavy, so it's fetched only when the detail sheet opens
  useEffect(() => {
    setSelectedImage(null);
    setReportMode(false);
    setReportNote("");
    setReportDone(false);
    setCopied(false);
    if (!selected) return;
    let alive = true;
    fetch(`/api/stations/${selected.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive && d.station?.image) setSelectedImage(d.station.image);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
        if (favOnly && !favIds.has(s.id)) return false;
        if (q) {
          const hay = [s.nameEn, s.nameAr, s.operator, s.town, s.address]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      }),
    [enriched, connFilter, powerFilter, operatorFilter, statusFilter, q, favOnly, favIds]
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

  const activeFilterCount = [connFilter, powerFilter, operatorFilter, statusFilter].filter(
    (f) => f !== "all"
  ).length;

  function pickStation(s: StationDto) {
    setMapCenter([s.latitude, s.longitude]);
    setSelected(s);
    setQuery("");
    setSearchFocused(false);
  }

  async function toggleFav(stationId: string) {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationId }),
    });
    if (!res.ok) return;
    const d = await res.json();
    setFavIds((prev) => {
      const next = new Set(prev);
      if (d.favorited) next.add(stationId);
      else next.delete(stationId);
      return next;
    });
  }

  function locateMe() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        setMapCenter([loc.lat, loc.lng]);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  const defaultVehicleSpec = (garage.find((v) => v.isDefault) ?? garage[0])?.spec;
  const rangeKm =
    rangeSoc != null && defaultVehicleSpec && defaultVehicleSpec.consumption > 0
      ? Math.round(
          ((rangeSoc / 100) * (defaultVehicleSpec.usableKwh || defaultVehicleSpec.batteryKwh)) /
            defaultVehicleSpec.consumption *
            100
        )
      : null;

  async function shareStation(s: StationDto) {
    const url = `https://www.google.com/maps/search/?api=1&query=${s.latitude},${s.longitude}`;
    const text = `${name(s)} — ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: name(s), text: name(s), url });
        return;
      } catch {
        /* user cancelled — fall through to clipboard */
      }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function copyCoords(s: StationDto) {
    await navigator.clipboard.writeText(`${s.latitude}, ${s.longitude}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function sendReport() {
    if (!selected) return;
    const res = await fetch(`/api/stations/${selected.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: reportNote }),
    });
    if (res.ok) {
      setReportDone(true);
      setReportMode(false);
    }
  }

  return (
    <div className="pt-2">
      <div className="animate-slide-up">
      <div className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold">{t.stationsTitle}</h1>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFavOnly((v) => !v)}
              aria-label={t.favOnly}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                favOnly
                  ? "border-amber-400 bg-amber-50 text-amber-500 dark:bg-amber-950"
                  : "text-muted-foreground hover:border-primary/40"
              }`}
            >
              <Star className="h-4 w-4" fill={favOnly ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => setShowFilters((v) => !v)}
              aria-label={t.filterConnector}
              className={`relative flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                showFilters || activeFilterCount > 0
                  ? "border-primary bg-accent text-primary"
                  : "text-muted-foreground hover:border-primary/40"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="num flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={refresh}
              disabled={refreshing}
              aria-label={t.refreshStations}
              className="flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        {refreshMsg && <p className="mt-1 text-xs font-semibold text-primary">{refreshMsg}</p>}

        {/* Search */}
        <div className="relative mt-2.5">
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
            <div className="absolute inset-x-0 top-12 z-[1200] overflow-hidden rounded-xl border bg-card card-shadow">
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

        {/* Filters — collapsible */}
        {showFilters && (
        <div className="mt-2.5 grid grid-cols-2 gap-2">
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
        )}

        {nearestCompatible && (
          <button
            onClick={() => pickStation(nearestCompatible)}
            className="mt-2.5 flex w-full items-center justify-between gap-2 rounded-xl border border-primary/30 bg-accent px-3.5 py-2 text-start"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Crosshair className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-primary">
                  {t.nearestCompatible}
                </span>
                <span className="line-clamp-1 text-sm font-semibold">{name(nearestCompatible)}</span>
              </span>
            </span>
            <span className="num shrink-0 text-xs font-bold text-primary">
              {nearestCompatible.distanceKm!.toFixed(1)} {t.km}
            </span>
          </button>
        )}
      </div>

      {/* Map — the hero of this screen */}
      <div className="relative h-[calc(100dvh-var(--map-offset,300px))] min-h-[440px] overflow-hidden rounded-2xl border card-shadow"
        style={{ ["--map-offset" as string]: showFilters ? "360px" : "260px" }}
      >
        <StationMap
          center={mapCenter ?? [origin.lat, origin.lng]}
          userLocation={location ? [location.lat, location.lng] : null}
          stations={filtered}
          highlightedId={selected?.id ?? nearestCompatible?.id}
          onSelect={(s) => {
            setMapCenter([s.latitude, s.longitude]);
            setSelected(s);
          }}
          rangeKm={rangeKm}
        />

        {/* Map overlay controls (above Leaflet's ~z-1000) */}
        <div className="absolute bottom-4 end-3 z-[1100] flex flex-col gap-2">
          <button
            onClick={() => {
              const opening = !rangePanel;
              setRangePanel(opening);
              if (opening && rangeSoc == null && defaultVehicleSpec) setRangeSoc(80);
            }}
            aria-label={t.rangeCircle}
            className={`flex h-11 w-11 items-center justify-center rounded-full border bg-card card-shadow transition-colors ${
              rangeSoc != null ? "border-amber-500 text-amber-600" : "text-muted-foreground hover:text-primary"
            }`}
          >
            <Gauge className="h-5 w-5" />
          </button>
          <button
            onClick={locateMe}
            aria-label={t.locateMe}
            className="flex h-11 w-11 items-center justify-center rounded-full border bg-card text-primary card-shadow transition-colors hover:bg-accent"
          >
            <LocateFixed className="h-5 w-5" />
          </button>
        </div>

        {/* Range ring panel */}
        {rangePanel && (
          <div className="absolute bottom-4 end-16 z-[1100] w-60 rounded-2xl border bg-card p-4 card-shadow">
            <p className="mb-2 text-xs font-bold">{t.rangeCircle}</p>
            {defaultVehicleSpec ? (
              <>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={rangeSoc ?? 80}
                  onChange={(e) => setRangeSoc(Number(e.target.value))}
                  className="w-full accent-[#B45309]"
                />
                <p className="num mt-1.5 text-xs font-semibold text-muted-foreground">
                  {rangeSoc != null && rangeKm != null
                    ? t.rangeAt(rangeSoc, rangeKm)
                    : t.rangeAt(80, Math.round(((80 / 100) * (defaultVehicleSpec.usableKwh || defaultVehicleSpec.batteryKwh)) / defaultVehicleSpec.consumption * 100))}
                </p>
                {rangeSoc != null && (
                  <button
                    onClick={() => { setRangeSoc(null); setRangePanel(false); }}
                    className="mt-2 w-full rounded-lg border py-1.5 text-xs font-bold text-muted-foreground hover:text-destructive"
                  >
                    {t.cancel}
                  </button>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">{t.rangeNeedsVehicle}</p>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Detail sheet — z above Leaflet's internal layers (~z-1000) */}
      {selected && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/50" onClick={() => setSelected(null)}>
          <div
            className="max-h-[85dvh] w-full max-w-md animate-slide-up overflow-y-auto rounded-t-3xl bg-card p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />
            {selectedImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedImage}
                alt={name(selected)}
                className="mb-4 h-44 w-full rounded-2xl border object-cover"
              />
            )}
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
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => toggleFav(selected.id)}
                  aria-label={favIds.has(selected.id) ? t.favRemove : t.favAdd}
                  className={`rounded-full p-1.5 transition-colors hover:bg-muted ${
                    favIds.has(selected.id) ? "text-amber-500" : "text-muted-foreground"
                  }`}
                >
                  <Star className="h-5 w-5" fill={favIds.has(selected.id) ? "currentColor" : "none"} />
                </button>
                <button onClick={() => setSelected(null)} aria-label={t.cancel} className="rounded-full p-1.5 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
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

            {/* Share / copy / report */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => shareStation(selected)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Share2 className="h-3.5 w-3.5" />
                {t.shareStation}
              </button>
              <button
                onClick={() => copyCoords(selected)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? t.copied : t.copyCoords}
              </button>
              <button
                onClick={() => setReportMode((v) => !v)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
              >
                <Flag className="h-3.5 w-3.5" />
                {t.reportIssue}
              </button>
            </div>

            {reportDone && (
              <p className="mt-2 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-primary">
                {t.reportSent}
              </p>
            )}
            {reportMode && !reportDone && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder={t.reportPlaceholder}
                  rows={2}
                  className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button variant="destructive" size="sm" className="w-full" onClick={sendReport}>
                  {t.reportSend}
                </Button>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selected.latitude},${selected.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full" size="lg">
                  <MapPin />
                  {t.viewMap}
                </Button>
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full" size="lg">
                  <Navigation />
                  {t.navigate}
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
