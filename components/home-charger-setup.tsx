"use client";

import { useEffect, useState } from "react";
import { Home as HomeIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { HOME_CHARGER_KW, HOME_SERVICES_TIERS } from "@/config/tariffs";

interface HomeCharger {
  meterType: "EV_METER" | "SERVICES_METER" | null;
  homeChargerKw: number | null;
  servicesTier: number | null;
}

/**
 * Meter type + charger power + services tier. Persists to the user
 * profile so the tariff engine prices home sessions correctly.
 */
export function HomeChargerSetup({
  onChange,
}: {
  onChange?: (v: HomeCharger) => void;
}) {
  const { t } = useI18n();
  const [v, setV] = useState<HomeCharger | null>(null);
  const [savedNote, setSavedNote] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) =>
        setV({
          meterType: d.user?.meterType ?? null,
          homeChargerKw: d.user?.homeChargerKw ?? null,
          servicesTier: d.user?.servicesTier ?? 2,
        })
      );
  }, []);

  async function patch(update: Partial<HomeCharger>) {
    const next = { ...(v as HomeCharger), ...update };
    setV(next);
    onChange?.(next);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 1800);
  }

  if (!v) return <p className="py-3 text-center text-xs text-muted-foreground">{t.loading}</p>;

  return (
    <div className="space-y-4 rounded-xl border border-dashed p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-bold">
          <HomeIcon className="h-4 w-4 text-primary" />
          {t.homeChargerTitle}
        </p>
        {savedNote && <span className="text-xs font-bold text-primary">{t.updated} ✓</span>}
      </div>

      <div>
        <Label>{t.meterType}</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["EV_METER", "SERVICES_METER"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => patch({ meterType: m })}
              className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${
                v.meterType === m
                  ? "border-primary bg-accent text-primary"
                  : "text-muted-foreground hover:border-primary/40"
              }`}
            >
              {m === "EV_METER" ? t.meterEv : t.meterServices}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>{t.chargerPower}</Label>
        <div className="grid grid-cols-4 gap-2">
          {HOME_CHARGER_KW.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => patch({ homeChargerKw: kw })}
              className={`num rounded-xl border px-2 py-2 text-sm font-bold transition-colors ${
                v.homeChargerKw === kw
                  ? "border-primary bg-accent text-primary"
                  : "text-muted-foreground hover:border-primary/40"
              }`}
            >
              {kw} <span className="text-[10px]">{t.kw}</span>
            </button>
          ))}
        </div>
      </div>

      {v.meterType === "SERVICES_METER" && (
        <div>
          <Label>{t.servicesTier}</Label>
          <div className="grid grid-cols-3 gap-2">
            {HOME_SERVICES_TIERS.map((tier) => (
              <button
                key={tier.tier}
                type="button"
                onClick={() => patch({ servicesTier: tier.tier })}
                className={`rounded-xl border px-2 py-2 text-xs font-bold transition-colors ${
                  v.servicesTier === tier.tier
                    ? "border-primary bg-accent text-primary"
                    : "text-muted-foreground hover:border-primary/40"
                }`}
              >
                {t.tier(tier.tier)}
                <span className="num block text-[10px] font-medium">
                  {tier.rate.toFixed(3)} {t.jodPerKwh}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
