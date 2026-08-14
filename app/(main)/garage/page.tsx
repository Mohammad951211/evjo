"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { VehicleCard } from "@/components/vehicle-card";
import { VehiclePicker } from "@/components/vehicle-picker";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { compressImage } from "@/lib/image";
import type { GarageVehicle } from "@/types";

export default function GaragePage() {
  const { t } = useI18n();
  const [vehicles, setVehicles] = useState<GarageVehicle[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [photoBusy, setPhotoBusy] = useState<string | null>(null);
  const pendingId = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    fetch("/api/garage")
      .then((r) => r.json())
      .then((d) => setVehicles(d.vehicles ?? []));
  }, []);

  useEffect(load, [load]);

  async function saveImage(id: string, image: string | null) {
    setPhotoBusy(id);
    await fetch(`/api/garage/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    });
    setPhotoBusy(null);
    load();
  }

  function pickPhoto(id: string) {
    pendingId.current = id;
    fileRef.current?.click();
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const id = pendingId.current;
    pendingId.current = null;
    if (!file || !id) return;
    try {
      const image = await compressImage(file);
      await saveImage(id, image);
    } catch {
      setPhotoBusy(null);
    }
  }

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

  async function rename(v: GarageVehicle) {
    const nickname = window.prompt(t.renamePrompt, v.nickname ?? "");
    if (nickname === null) return;
    await fetch(`/api/garage/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nickname.trim() }),
    });
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
              onRename={() => rename(v)}
              onPhoto={() => pickPhoto(v.id)}
              onRemovePhoto={() => saveImage(v.id, null)}
              photoBusy={photoBusy === v.id}
            />
          ))
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />

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
