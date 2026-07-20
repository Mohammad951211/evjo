"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calculator, Clock, Coins, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/lib/i18n";
import { computeChargeCost, type RateContext } from "@/lib/tariff";
import {
  PETROL_PRICE_JOD_PER_L,
  ICE_CONSUMPTION_L_PER_100KM,
  STATION_RATES,
  HOME_EV_METER_RATES,
  HOME_SERVICES_TIERS,
} from "@/config/tariffs";
import type { GarageVehicle } from "@/types";

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface ProfileInfo {
  meterType: "EV_METER" | "SERVICES_METER" | null;
  homeChargerKw: number | null;
  servicesTier: number | null;
}

export default function CalculatorPage() {
  const { t, locale } = useI18n();
  const [garage, setGarage] = useState<GarageVehicle[]>([]);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [where, setWhere] = useState<"station" | "home">("station");
  const [socFrom, setSocFrom] = useState(30);
  const [socTo, setSocTo] = useState(80);
  const [startAt, setStartAt] = useState(() => toLocalInputValue(new Date()));
  const [saved, setSaved] = useState(false);
  const [avgDaily, setAvgDaily] = useState("40");

  useEffect(() => {
    fetch("/api/garage")
      .then((r) => r.json())
      .then((d) => {
        const vs: GarageVehicle[] = d.vehicles ?? [];
        setGarage(vs);
        const def = vs.find((v) => v.isDefault) ?? vs[0];
        if (def) setVehicleId(def.id);
      });
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) =>
        setProfile({
          meterType: d.user?.meterType ?? null,
          homeChargerKw: d.user?.homeChargerKw ?? null,
          servicesTier: d.user?.servicesTier ?? 2,
        })
      );
  }, []);

  const vehicle = garage.find((v) => v.id === vehicleId);

  const result = useMemo(() => {
    if (!vehicle || socTo <= socFrom) return null;
    const usable = vehicle.spec.usableKwh || vehicle.spec.batteryKwh;
    const kwhNeeded = ((socTo - socFrom) / 100) * usable;

    let powerKw: number;
    let ctx: RateContext;
    if (where === "station") {
      powerKw = Math.max(vehicle.spec.dcKw, 1);
      ctx = { location: "station" };
    } else {
      if (!profile?.meterType || !profile.homeChargerKw) return "needsHome" as const;
      powerKw = profile.homeChargerKw;
      ctx =
        profile.meterType === "EV_METER"
          ? { location: "home", meterType: "EV_METER" }
          : { location: "home", meterType: "SERVICES_METER", tier: profile.servicesTier ?? 2 };
    }

    const start = new Date(startAt);
    if (isNaN(start.getTime())) return null;
    const res = computeChargeCost({ kwhNeeded, powerKw, start, ctx });

    const rangeAdded =
      vehicle.spec.consumption > 0 ? (kwhNeeded / vehicle.spec.consumption) * 100 : 0;
    const costPerKm = rangeAdded > 0 ? res.totalCost / rangeAdded : 0;
    return { ...res, rangeAdded, costPerKm };
  }, [vehicle, socFrom, socTo, startAt, where, profile]);

  const monthly = useMemo(() => {
    if (!vehicle) return null;
    const km = Number(avgDaily) * 30.4;
    const kwh = (km / 100) * vehicle.spec.consumption;
    // representative rates: overnight home charging vs daytime partial station mix
    const homeRate =
      profile?.meterType === "SERVICES_METER"
        ? (HOME_SERVICES_TIERS.find((x) => x.tier === (profile.servicesTier ?? 2)) ?? HOME_SERVICES_TIERS[1]).rate
        : HOME_EV_METER_RATES.offpeak;
    const stationRate = STATION_RATES.partial;
    const petrol = (km / 100) * ICE_CONSUMPTION_L_PER_100KM * PETROL_PRICE_JOD_PER_L;
    return {
      km,
      kwh,
      home: kwh * homeRate,
      station: kwh * stationRate,
      petrol,
    };
  }, [vehicle, avgDaily, profile]);

  async function saveSession() {
    if (!result || result === "needsHome" || !vehicle) return;
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userVehicleId: vehicle.id,
        locationType: where === "station" ? "STATION" : "HOME",
        startedAt: new Date(startAt).toISOString(),
        kwh: Math.round(result.kwh * 100) / 100,
        costJod: result.totalCost,
        durationMin: result.durationMin,
      }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  const periodLabel = (p: string) =>
    p === "offpeak" ? t.periodOffpeak : p === "partial" ? t.periodPartial : t.periodPeak;

  const fmtT = (d: Date) =>
    d.toLocaleTimeString(locale === "ar" ? "ar-JO" : "en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="animate-slide-up pt-2">
      <h1 className="flex items-center gap-2 text-lg font-bold">
        <Calculator className="h-5 w-5 text-primary" />
        {t.calcTitle}
      </h1>

      <div className="mt-4 space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-5">
          {/* location toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            {(["station", "home"] as const).map((w) => (
              <button
                key={w}
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
                  {v.spec.name} — {v.spec.batteryKwh} kWh
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>
              {t.currentSoc}: <span className="num font-bold text-primary">{socFrom}%</span>
            </Label>
            <Slider min={0} max={100} value={socFrom} onValueChange={setSocFrom} />
          </div>
          <div>
            <Label>
              {t.targetSoc}: <span className="num font-bold text-primary">{socTo}%</span>
            </Label>
            <Slider min={0} max={100} value={socTo} onValueChange={setSocTo} />
          </div>

          <div>
            <Label>{t.startTime}</Label>
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                dir="ltr"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
              <Button variant="outline" onClick={() => setStartAt(toLocalInputValue(new Date()))}>
                {t.nowLabel}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
      {result === "needsHome" && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-5 text-sm font-semibold text-amber-800">
            {t.setupHomeFirst}{" "}
            <Link href="/sessions?tab=new" className="underline">
              {t.navCharging}
            </Link>
          </CardContent>
        </Card>
      )}

      {result && result !== "needsHome" && (
        <Card>
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-accent p-3 text-center">
                <Zap className="mx-auto h-4 w-4 text-primary" />
                <p className="num mt-1 text-xl font-bold">{result.kwh.toFixed(1)}</p>
                <p className="text-[11px] text-muted-foreground">{t.kwhAdded} ({t.kwh})</p>
              </div>
              <div className="rounded-xl bg-accent p-3 text-center">
                <Clock className="mx-auto h-4 w-4 text-primary" />
                <p className="num mt-1 text-xl font-bold">
                  {result.durationMin >= 60
                    ? `${Math.floor(result.durationMin / 60)}:${(result.durationMin % 60).toString().padStart(2, "0")}`
                    : result.durationMin}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t.chargeDuration} ({result.durationMin >= 60 ? t.hour : t.min})
                </p>
              </div>
              <div className="rounded-xl bg-primary p-3 text-center text-primary-foreground">
                <Coins className="mx-auto h-4 w-4" />
                <p className="num mt-1 text-xl font-bold">{result.totalCost.toFixed(3)}</p>
                <p className="text-[11px] text-primary-foreground/80">{t.totalCost} ({t.jod})</p>
              </div>
              <div className="rounded-xl bg-accent p-3 text-center">
                <p className="num mt-4 text-xl font-bold">{result.costPerKm.toFixed(3)}</p>
                <p className="text-[11px] text-muted-foreground">{t.costPerKm}</p>
              </div>
            </div>

            {result.segments.length > 1 && (
              <div className="mt-4 rounded-xl bg-muted/60 p-3">
                <p className="mb-2 text-xs font-bold text-muted-foreground">{t.costBreakdown}</p>
                <div className="space-y-1.5">
                  {result.segments.map((seg, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-semibold">
                        {periodLabel(seg.period)}{" "}
                        <span className="num text-muted-foreground">
                          {fmtT(seg.from)}–{fmtT(seg.to)}
                        </span>
                      </span>
                      <span className="num">
                        {seg.kwh.toFixed(1)} {t.kwh} × {seg.rate.toFixed(3)} ={" "}
                        <b>{seg.cost.toFixed(3)}</b>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button className="mt-4 w-full" onClick={saveSession} disabled={!vehicle}>
              {saved ? t.sessionSaved : t.saveSession}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Monthly comparison */}
      <Card>
        <CardHeader>
          <CardTitle>{t.monthlyCompareTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>{t.avgDailyKm}</Label>
            <Input
              type="number"
              min={1}
              dir="ltr"
              value={avgDaily}
              onChange={(e) => setAvgDaily(e.target.value)}
            />
          </div>
          {monthly && vehicle && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">{t.monthlyKwh}</span>
                <span className="num font-bold">{monthly.kwh.toFixed(0)} {t.kwh}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.monthlyHome}</span>
                <span className="num font-bold text-primary">{monthly.home.toFixed(2)} {t.jod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.monthlyStation}</span>
                <span className="num font-bold">{monthly.station.toFixed(2)} {t.jod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.monthlyPetrol}</span>
                <span className="num font-bold text-destructive">{monthly.petrol.toFixed(2)} {t.jod}</span>
              </div>
              <p className="pt-1 text-[11px] text-muted-foreground">
                {t.petrolAssumption(PETROL_PRICE_JOD_PER_L, ICE_CONSUMPTION_L_PER_100KM)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
      </div>
    </div>
  );
}
