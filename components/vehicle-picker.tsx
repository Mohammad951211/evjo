"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import type { VehicleSpec } from "@/types";

const OTHER = "__other__";

/**
 * Make → model → battery variant → year cascade, backed by the seeded
 * catalog, with an "Other / Not Listed" manual entry path.
 */
export function VehiclePicker({
  onSaved,
  submitLabel,
}: {
  onSaved: () => void;
  submitLabel?: string;
}) {
  const { t } = useI18n();
  const [catalog, setCatalog] = useState<VehicleSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [variantId, setVariantId] = useState("");
  const [year, setYear] = useState("");
  const [busy, setBusy] = useState(false);

  // custom entry
  const [customName, setCustomName] = useState("");
  const [customBattery, setCustomBattery] = useState("60");
  const [customConsumption, setCustomConsumption] = useState("16");
  const [customDc, setCustomDc] = useState("100");
  const [customConnector, setCustomConnector] = useState("CCS2");

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((d) => setCatalog(d.vehicles ?? []))
      .finally(() => setLoading(false));
  }, []);

  const makes = useMemo(
    () => Array.from(new Set(catalog.map((v) => v.make))).sort(),
    [catalog]
  );
  const models = useMemo(
    () => Array.from(new Set(catalog.filter((v) => v.make === make).map((v) => v.model))),
    [catalog, make]
  );
  const variants = useMemo(
    () => catalog.filter((v) => v.make === make && v.model === model),
    [catalog, make, model]
  );
  const selected = variants.find((v) => v.id === variantId);
  const years = useMemo(() => {
    if (!selected) return [];
    const to = selected.yearTo ?? new Date().getFullYear() + 1;
    const list: number[] = [];
    for (let y = to; y >= selected.yearFrom; y--) list.push(y);
    return list;
  }, [selected]);

  const isOther = make === OTHER;
  const canSubmit = isOther
    ? customName && Number(customBattery) > 0 && Number(customConsumption) > 0
    : Boolean(variantId && year);

  async function submit() {
    setBusy(true);
    const body = isOther
      ? {
          custom: {
            name: customName,
            batteryKwh: Number(customBattery),
            consumption: Number(customConsumption),
            dcKw: Number(customDc),
            connector: customConnector,
          },
        }
      : { vehicleId: variantId, year: Number(year) };
    const res = await fetch("/api/garage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) onSaved();
  }

  if (loading) return <p className="py-6 text-center text-sm text-muted-foreground">{t.loading}</p>;

  return (
    <div className="space-y-4">
      <div>
        <Label>{t.make}</Label>
        <Select
          value={make}
          onChange={(e) => {
            setMake(e.target.value);
            setModel("");
            setVariantId("");
            setYear("");
          }}
        >
          <option value="" disabled>
            —
          </option>
          {makes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
          <option value={OTHER}>{t.otherNotListed}</option>
        </Select>
      </div>

      {!isOther && make && (
        <div>
          <Label>{t.model}</Label>
          <Select
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setVariantId("");
              setYear("");
            }}
          >
            <option value="" disabled>
              —
            </option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>
      )}

      {!isOther && model && (
        <div>
          <Label>{t.batteryVariant}</Label>
          <Select
            value={variantId}
            onChange={(e) => {
              setVariantId(e.target.value);
              setYear("");
            }}
          >
            <option value="" disabled>
              —
            </option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.variant} — {v.batteryKwh} kWh
              </option>
            ))}
          </Select>
        </div>
      )}

      {!isOther && variantId && (
        <div>
          <Label>{t.year}</Label>
          <Select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="" disabled>
              —
            </option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
      )}

      {selected && year && (
        <div className="rounded-xl bg-accent p-3 text-sm">
          <div className="num grid grid-cols-2 gap-2 font-medium">
            <span>{t.battery}: {selected.batteryKwh} {t.kwh}</span>
            <span>{t.range}: {selected.rangeKm} {t.km}</span>
            <span>{t.maxDc}: {selected.dcKw} {t.kw}</span>
            <span>{t.consumption}: {selected.consumption}</span>
          </div>
        </div>
      )}

      {isOther && (
        <div className="space-y-4 rounded-xl border border-dashed p-4">
          <div>
            <Label>{t.customVehicleName}</Label>
            <Input value={customName} onChange={(e) => setCustomName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t.battery} ({t.kwh})</Label>
              <Input type="number" min={5} step={0.1} value={customBattery} onChange={(e) => setCustomBattery(e.target.value)} />
            </div>
            <div>
              <Label>{t.consumption}</Label>
              <Input type="number" min={5} step={0.1} value={customConsumption} onChange={(e) => setCustomConsumption(e.target.value)} />
            </div>
            <div>
              <Label>{t.maxDc} ({t.kw})</Label>
              <Input type="number" min={0} step={1} value={customDc} onChange={(e) => setCustomDc(e.target.value)} />
            </div>
            <div>
              <Label>{t.connector}</Label>
              <Select value={customConnector} onChange={(e) => setCustomConnector(e.target.value)}>
                <option value="CCS2">CCS2</option>
                <option value="GBT_DC">GB/T DC</option>
                <option value="CHADEMO">CHAdeMO</option>
                <option value="TYPE2">Type 2 (AC)</option>
              </Select>
            </div>
          </div>
        </div>
      )}

      <Button className="w-full" disabled={!canSubmit || busy} onClick={submit}>
        {busy ? t.loading : (submitLabel ?? t.addVehicle)}
      </Button>
    </div>
  );
}
