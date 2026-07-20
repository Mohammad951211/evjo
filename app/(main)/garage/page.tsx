"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { VehicleCard } from "@/components/vehicle-card";
import { VehiclePicker } from "@/components/vehicle-picker";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import type { GarageVehicle } from "@/types";

export default function GaragePage() {
  const { t } = useI18n();
  const [vehicles, setVehicles] = useState<GarageVehicle[] | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    fetch("/api/garage")
      .then((r) => r.json())
      .then((d) => setVehicles(d.vehicles ?? []));
  }, []);

  useEffect(load, [load]);

  async function setDefault(id: string) {
    await fetch(`/api/garage/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/garage/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="animate-slide-up pt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">{t.garageTitle}</h1>
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus />
          {t.addVehicle}
        </Button>
      </div>

      <div className="mt-4 grid gap-4">
        {vehicles === null ? (
          <>
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
          </>
        ) : vehicles.length === 0 ? (
          <p className="rounded-2xl border border-dashed py-14 text-center text-sm text-muted-foreground">
            {t.emptyGarage}
          </p>
        ) : (
          vehicles.map((v) => (
            <VehicleCard
              key={v.id}
              v={v}
              actions
              onSetDefault={() => setDefault(v.id)}
              onDelete={() => remove(v.id)}
            />
          ))
        )}
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setAdding(false)}>
          <div
            className="max-h-[88dvh] w-full max-w-md animate-slide-up overflow-y-auto rounded-t-3xl bg-card p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">{t.addVehicle}</h2>
              <button onClick={() => setAdding(false)} aria-label={t.cancel} className="rounded-full p-1.5 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <VehiclePicker
              onSaved={() => {
                setAdding(false);
                load();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
