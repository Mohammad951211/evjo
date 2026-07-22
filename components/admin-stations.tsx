"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Plus, Trash2, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import type { StationDto } from "@/types";

/** Admin: add missing stations by hand + manage the manually added list. */
export function AdminStations() {
  const { t, locale } = useI18n();
  const [manual, setManual] = useState<StationDto[] | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [town, setTown] = useState("");
  const [operator, setOperator] = useState("");
  const [connType, setConnType] = useState("CCS2");
  const [powerKw, setPowerKw] = useState("50");
  const [quantity, setQuantity] = useState("1");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/stations")
      .then((r) => r.json())
      .then((d) => setManual(d.stations ?? []));
  }, []);

  useEffect(load, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/stations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        location,
        town: town || null,
        operator: operator || null,
        connector: { type: connType, powerKw: Number(powerKw), quantity: Number(quantity) },
      }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: t.stationAdded });
      setName("");
      setLocation("");
      setTown("");
      setOperator("");
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg({
        ok: false,
        text:
          d.error === "out_of_bounds"
            ? t.locationOutOfJordan
            : d.error === "bad_location"
              ? t.locationInvalid
              : t.locationInvalid,
      });
    }
  }

  async function remove(id: string) {
    await fetch(`/api/admin/stations/${id}`, { method: "DELETE" });
    load();
  }

  const stationName = (s: StationDto) => (locale === "ar" && s.nameAr ? s.nameAr : s.nameEn);

  return (
    <div className="space-y-4">
      {/* Add form */}
      <Card>
        <CardContent className="pt-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold">
            <Plus className="h-4 w-4 text-primary" />
            {t.addStationTitle}
          </p>
          <form onSubmit={submit} className="space-y-3.5">
            <div>
              <Label htmlFor="st-name">{t.stationNameLabel}</Label>
              <Input id="st-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="st-loc">{t.locationLabel}</Label>
              <Input
                id="st-loc"
                dir="ltr"
                placeholder={t.locationPlaceholder}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{t.locationHint}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="st-town">{t.townLabel}</Label>
                <Input id="st-town" value={town} onChange={(e) => setTown(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="st-op">{t.operatorOptional}</Label>
                <Input id="st-op" value={operator} onChange={(e) => setOperator(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>{t.connector}</Label>
                <Select value={connType} onChange={(e) => setConnType(e.target.value)}>
                  <option value="CCS2">CCS2</option>
                  <option value="CHADEMO">CHAdeMO</option>
                  <option value="GBT_DC">GB/T DC</option>
                  <option value="TYPE2">Type 2 (AC)</option>
                </Select>
              </div>
              <div>
                <Label>{t.filterPower} ({t.kw})</Label>
                <Input type="number" dir="ltr" min={0} step={1} value={powerKw} onChange={(e) => setPowerKw(e.target.value)} />
              </div>
              <div>
                <Label>{t.pointsLabel}</Label>
                <Input type="number" dir="ltr" min={1} step={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
            </div>
            {msg && (
              <p className={`text-sm font-semibold ${msg.ok ? "text-primary" : "text-destructive"}`}>
                {msg.text}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy || !name || !location}>
              {busy ? t.loading : t.addStationBtn}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Manual stations list */}
      <div>
        <p className="mb-2 text-xs font-bold text-muted-foreground">{t.manualStationsTitle}</p>
        {manual === null ? (
          <p className="py-4 text-center text-xs text-muted-foreground">{t.loading}</p>
        ) : manual.length === 0 ? (
          <p className="rounded-2xl border border-dashed py-8 text-center text-sm text-muted-foreground">
            {t.noManualStations}
          </p>
        ) : (
          <div className="space-y-2">
            {manual.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 card-shadow">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold">{stationName(s)}</p>
                  <p className="num text-[11px] text-muted-foreground" dir="ltr">
                    {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                    {s.town ? ` · ${s.town}` : ""}
                  </p>
                </div>
                {s.maxPowerKw > 0 && (
                  <Badge className="num shrink-0">
                    <Zap className="h-3 w-3" /> {s.maxPowerKw} {t.kw}
                  </Badge>
                )}
                <button
                  onClick={() => remove(s.id)}
                  aria-label={t.delete}
                  className="shrink-0 rounded-full p-2 text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
