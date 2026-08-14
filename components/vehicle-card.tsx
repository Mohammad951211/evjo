"use client";

import { Car, BatteryFull, Gauge, PlugZap, Zap, Pencil, Camera, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { photoSrc } from "@/lib/image";
import type { GarageVehicle } from "@/types";
import { cn } from "@/lib/utils";

const CONNECTOR_LABEL: Record<string, string> = {
  CCS2: "CCS2",
  CHADEMO: "CHAdeMO",
  GBT_DC: "GB/T DC",
  TYPE2: "Type 2",
};

export function VehicleCard({
  v,
  onSetDefault,
  onDelete,
  onRename,
  onPhoto,
  onRemovePhoto,
  photoBusy,
  actions,
}: {
  v: GarageVehicle;
  onSetDefault?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
  onPhoto?: () => void;
  onRemovePhoto?: () => void;
  photoBusy?: boolean;
  actions?: boolean;
}) {
  const { t } = useI18n();
  const s = v.spec;
  const userPhoto = photoSrc(v.image);
  const photo = userPhoto ?? photoSrc(s.image);

  return (
    <Card className={cn("overflow-hidden", v.isDefault && "border-primary/50 ring-1 ring-primary/30")}>
      {/* vehicle banner — real photo when available, else a stylised icon */}
      <div className="relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-accent to-secondary">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={s.name} className="h-full w-full object-cover" />
        ) : (
          <Car className="h-14 w-14 text-primary/70" strokeWidth={1.4} />
        )}
        {v.isDefault && (
          <Badge className="absolute start-3 top-3 bg-primary text-primary-foreground">
            {t.defaultVehicle}
          </Badge>
        )}
        <Badge variant="outline" className="absolute end-3 top-3 bg-card/80">
          {CONNECTOR_LABEL[s.connector] ?? s.connector}
        </Badge>

        {onPhoto && (
          <div className="absolute bottom-2 end-2 flex items-center gap-1.5">
            {userPhoto && onRemovePhoto && (
              <button
                onClick={onRemovePhoto}
                disabled={photoBusy}
                aria-label={t.removePhoto}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-destructive shadow-sm backdrop-blur transition-colors hover:bg-card disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onPhoto}
              disabled={photoBusy}
              aria-label={userPhoto ? t.changePhoto : t.addCarPhoto}
              className="flex h-8 items-center gap-1.5 rounded-full bg-card/90 px-3 text-xs font-bold text-primary shadow-sm backdrop-blur transition-colors hover:bg-card disabled:opacity-50"
            >
              <Camera className="h-3.5 w-3.5" />
              {photoBusy ? t.loading : userPhoto ? t.changePhoto : t.addCarPhoto}
            </button>
          </div>
        )}
      </div>
      <CardContent className="pt-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-base font-bold">
            {s.name}
            {v.year ? <span className="num ms-2 text-sm font-medium text-muted-foreground">{v.year}</span> : null}
          </h3>
        </div>
        {v.nickname && <p className="text-xs text-muted-foreground">{v.nickname}</p>}

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
          <div className="flex items-center gap-2">
            <BatteryFull className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <dt className="text-[11px] text-muted-foreground">{t.battery}</dt>
              <dd className="num font-semibold">{s.batteryKwh} {t.kwh}</dd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <dt className="text-[11px] text-muted-foreground">{t.range}</dt>
              <dd className="num font-semibold">{s.rangeKm ?? "—"} {t.km}</dd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <dt className="text-[11px] text-muted-foreground">{t.maxDc}</dt>
              <dd className="num font-semibold">{s.dcKw} {t.kw}</dd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PlugZap className="h-4 w-4 shrink-0 text-primary" />
            <div>
              <dt className="text-[11px] text-muted-foreground">{t.consumption}</dt>
              <dd className="num font-semibold">{s.consumption} <span className="text-[10px]">{t.per100}</span></dd>
            </div>
          </div>
        </dl>

        {actions && (
          <div className="mt-4 flex gap-2">
            {onRename && (
              <button
                onClick={onRename}
                aria-label={t.renameVehicle}
                className="rounded-lg border px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {!v.isDefault && onSetDefault && (
              <button
                onClick={onSetDefault}
                className="flex-1 rounded-lg border border-primary/40 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
              >
                {t.setDefault}
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="rounded-lg border border-destructive/30 px-3 py-2 text-xs font-bold text-destructive transition-colors hover:bg-destructive/5"
              >
                {t.delete}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
