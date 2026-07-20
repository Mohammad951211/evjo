"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { HomeChargerSetup } from "@/components/home-charger-setup";
import { useAppStore, DEFAULT_CENTER } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { haversineKm, roadKm } from "@/lib/geo";
import { computeChargeCost } from "@/lib/tariff";
import type { GarageVehicle, StationDto } from "@/types";

/** Record a charging session (station or home). Cost is priced in JOD server-side. */
export function SessionForm({ onSaved }: { onSaved: () => void }) {
  const { t, locale } = useI18n();
  const location = useAppStore((s) => s.location);
  const [garage, setGarage] = useState<GarageVehicle[]>([]);
  const [stations, setStations] = useState<StationDto[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [where, setWhere] = useState<"station" | "home">("station");
  const [stationId, setStationId] = useState("");
  const [kwh, setKwh] = useState("20");
  const [busy, setBusy] = useState(false);

  const origin = location ?? DEFAULT_CENTER;

  useEffect(() => {
    fetch("/api/garage")
      .then((r) => r.json())
      .then((d) => {
        const vs: GarageVehicle[] = d.vehicles ?? [];
        setGarage(vs);
        const def = vs.find((v) => v.isDefault) ?? vs[0];
        if (def) setVehicleId(def.id);
      });
    fetch("/api/stations")
      .then((r) => r.json())
      .then((d) => setStations(d.stations ?? []));
  }, []);

  const sorted = useMemo(
    () =>
      stations
        .map((s) => ({
          ...s,
          distanceKm: roadKm(haversineKm(origin.lat, origin.lng, s.latitude, s.longitude)),
        }))
        .sort((a, b) => a.distanceKm! - b.distanceKm!),
    [stations, origin]
  );

  useEffect(() => {
    if (!stationId && sorted.length > 0) setStationId(sorted[0].id);
  }, [sorted, stationId]);

  const estimate = useMemo(() => {
    const k = Number(kwh);
    if (!k || k <= 0) return null;
    return computeChargeCost({
      kwhNeeded: k,
      powerKw: 60,
      start: new Date(),
      ctx: { location: "station" },
    }).totalCost;
  }, [kwh]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userVehicleId: vehicleId || null,
        locationType: where === "station" ? "STATION" : "HOME",
        stationId: where === "station" ? stationId || null : null,
        startedAt: new Date().toISOString(),
        kwh: Number(kwh),
      }),
    });
    setBusy(false);
    if (res.ok) onSaved();
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <p className="mb-4 text-sm text-muted-foreground">{t.linkBody}</p>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            {(["station", "home"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWhere(w)}
                className={`rounded-lg py-2 text-sm font-bold transition-colors ${
                  where === w ? "bg-card text-primary card-shadow" : "text-muted-foreground"
                }`}
              >
                {w === "station" ? t.atStation : t.atHome}
              </button>
            ))}
          </div>

          <div>
            <Label>{t.vehicle}</Label>
            <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              {garage.length === 0 && <option value="">{t.addVehicleFirst}</option>}
              {garage.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.spec.name}
                </option>
              ))}
            </Select>
          </div>

          {where === "home" && <HomeChargerSetup />}

          {where === "station" && (
            <div>
              <Label>{t.station}</Label>
              <Select value={stationId} onChange={(e) => setStationId(e.target.value)}>
                {sorted.map((s) => (
                  <option key={s.id} value={s.id}>
                    {(locale === "ar" && s.nameAr ? s.nameAr : s.nameEn)} — {s.distanceKm!.toFixed(1)} {t.km}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Label>{t.energyDelivered}</Label>
            <Input
              type="number"
              dir="ltr"
              min={0.5}
              step={0.5}
              value={kwh}
              onChange={(e) => setKwh(e.target.value)}
              required
            />
            {estimate !== null && where === "station" && (
              <p className="num mt-1.5 text-xs text-muted-foreground">
                ≈ {estimate.toFixed(3)} {t.jod}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? t.loading : t.linkNow}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
