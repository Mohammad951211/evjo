"use client";

import { useEffect, useState } from "react";
import { Route, BatteryCharging, MapPin, Flag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { JO_CITIES } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";
import type { GarageVehicle, TripPlan } from "@/types";

export default function TripPage() {
  const { t, locale } = useI18n();
  const [garage, setGarage] = useState<GarageVehicle[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [originId, setOriginId] = useState("amman");
  const [destId, setDestId] = useState("aqaba");
  const [soc, setSoc] = useState(80);
  const [climate, setClimate] = useState(false);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/garage")
      .then((r) => r.json())
      .then((d) => {
        const vs: GarageVehicle[] = d.vehicles ?? [];
        setGarage(vs);
        const def = vs.find((v) => v.isDefault) ?? vs[0];
        if (def) setVehicleId(def.id);
      });
  }, []);

  async function submit() {
    setBusy(true);
    setPlan(null);
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originId,
        destinationId: destId,
        userVehicleId: vehicleId,
        startSocPct: soc,
        climateLoad: climate,
        locale,
      }),
    });
    setBusy(false);
    if (res.ok) setPlan((await res.json()).plan);
  }

  const cityName = (id: string) => {
    const c = JO_CITIES.find((x) => x.id === id);
    return c ? (locale === "ar" ? c.nameAr : c.nameEn) : id;
  };

  return (
    <div className="animate-slide-up pt-2">
      <h1 className="flex items-center gap-2 text-lg font-bold">
        <Route className="h-5 w-5 text-primary" />
        {t.tripTitle}
      </h1>

      <div className="mt-4 space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t.origin}</Label>
              <Select value={originId} onChange={(e) => setOriginId(e.target.value)}>
                {JO_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {locale === "ar" ? c.nameAr : c.nameEn}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>{t.destination}</Label>
              <Select value={destId} onChange={(e) => setDestId(e.target.value)}>
                {JO_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {locale === "ar" ? c.nameAr : c.nameEn}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label>{t.vehicle}</Label>
            <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              {garage.length === 0 && <option value="">{t.addVehicleFirst}</option>}
              {garage.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.spec.name} — {v.spec.batteryKwh} kWh
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>
              {t.currentSoc}: <span className="num font-bold text-primary">{soc}%</span>
            </Label>
            <Slider min={5} max={100} value={soc} onValueChange={setSoc} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
            <span className="text-sm font-semibold">{t.climateLoad}</span>
            <Switch checked={climate} onCheckedChange={setClimate} />
          </div>

          <Button className="w-full" size="lg" onClick={submit} disabled={!vehicleId || busy}>
            {busy ? t.loading : t.planTrip}
          </Button>
        </CardContent>
      </Card>

      {plan && (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">{t.tripSummary}</h2>
              <Badge variant={plan.feasibleDirect ? "success" : plan.arrivalSocPct > 0 ? "warning" : "danger"}>
                {plan.feasibleDirect ? t.directFeasible : t.needsStops}
              </Badge>
            </div>

            <div className="num mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-xl bg-accent p-2.5">
                <p className="text-lg font-bold">{plan.distanceKm}</p>
                <p className="text-[10px] text-muted-foreground">{t.routeDistance} ({t.km})</p>
              </div>
              <div className="rounded-xl bg-accent p-2.5">
                <p className="text-lg font-bold">{plan.energyKwh}</p>
                <p className="text-[10px] text-muted-foreground">{t.energyNeeded} ({t.kwh})</p>
              </div>
              <div className="rounded-xl bg-accent p-2.5">
                <p className="text-lg font-bold">{plan.arrivalSocPct}%</p>
                <p className="text-[10px] text-muted-foreground">{t.arriveAt}</p>
              </div>
            </div>

            {plan.arrivalSocPct <= 0 && !plan.feasibleDirect && plan.stops.length === 0 && (
              <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                {t.insufficientEvenWithStops}
              </p>
            )}

            {plan.stops.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold text-muted-foreground">{t.suggestedStops}</p>
                <div className="space-y-2">
                  {plan.stops.map((s, i) => (
                    <div key={s.stationId} className="rounded-xl border p-3">
                      <div className="flex items-center gap-2">
                        <span className="num flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                          {i + 1}
                        </span>
                        <p className="flex-1 text-sm font-bold">{s.name}</p>
                        <Badge className="num">{s.powerKw} {t.kw}</Badge>
                      </div>
                      <div className="num mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{t.detour}: <b className="text-foreground">{s.detourKm} {t.km}</b></span>
                        <span>{t.arriveAt}: <b className="text-foreground">{s.arrivalSocPct}%</b> → {s.chargeToPct}%</span>
                        <span>{t.kwhAdded}: <b className="text-foreground">{s.kwhAdded} {t.kwh}</b></span>
                        <span>{t.chargeDuration}: <b className="text-foreground">{s.chargeMin} {t.min}</b></span>
                        <span className="col-span-2">{t.totalCost}: <b className="text-primary">{s.costJod.toFixed(3)} {t.jod}</b></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Waypoints */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold text-muted-foreground">{t.waypoints}</p>
              <ol className="relative ms-3 space-y-3 border-s-2 border-primary/25 ps-4">
                {plan.waypoints.map((w, i) => {
                  const last = i === plan.waypoints.length - 1;
                  const Icon = i === 0 ? MapPin : last ? Flag : BatteryCharging;
                  return (
                    <li key={i} className="relative">
                      <span className="absolute -start-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                        <Icon className="h-2.5 w-2.5" />
                      </span>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold">
                          {i === 0 ? cityName(originId) : last ? cityName(destId) : w.label}
                        </span>
                        <span className="num text-xs text-muted-foreground">
                          {w.km} {t.km} · {t.socAtPoint}{" "}
                          <b className={w.socPct < 15 ? "text-destructive" : "text-primary"}>{w.socPct}%</b>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
