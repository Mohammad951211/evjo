"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Car, Camera, Search, X, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { compressImage, photoSrc } from "@/lib/image";

interface CatalogModel {
  make: string;
  model: string;
  image: string | null;
  variants: number;
}

/** Admin: upload a real photo per vehicle model (applies to all its variants). */
export function AdminVehicles() {
  const { t } = useI18n();
  const [models, setModels] = useState<CatalogModel[] | null>(null);
  const [q, setQ] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const pending = useRef<{ make: string; model: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/vehicles")
      .then((r) => (r.ok ? r.json() : { models: [] }))
      .then((d) => setModels(d.models ?? []))
      .catch(() => setModels([]));
  }, []);

  const filtered = useMemo(() => {
    if (!models) return [];
    const s = q.trim().toLowerCase();
    if (!s) return models;
    return models.filter((m) => `${m.make} ${m.model}`.toLowerCase().includes(s));
  }, [models, q]);

  function keyOf(m: { make: string; model: string }) {
    return `${m.make}|||${m.model}`;
  }

  function trigger(m: CatalogModel) {
    pending.current = { make: m.make, model: m.model };
    fileRef.current?.click();
  }

  async function save(make: string, model: string, image: string | null) {
    setBusyKey(`${make}|||${model}`);
    setMsg(null);
    const res = await fetch("/api/admin/vehicles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ make, model, image }),
    });
    setBusyKey(null);
    if (res.ok) {
      setModels((prev) =>
        (prev ?? []).map((m) => (m.make === make && m.model === model ? { ...m, image } : m)),
      );
      setMsg(t.photoSaved);
      setTimeout(() => setMsg(null), 2000);
    } else {
      setMsg(t.photoError);
    }
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const target = pending.current;
    pending.current = null;
    if (!file || !target) return;
    try {
      const image = await compressImage(file);
      await save(target.make, target.model, image);
    } catch {
      setMsg(t.photoError);
    }
  }

  if (models === null) {
    return (
      <div className="mt-4 space-y-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  return (
    <div className="mt-4">
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />

      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.vehicleSearchPlaceholder}
          className="ps-9"
        />
      </div>

      {msg && <p className="mt-2 text-center text-xs font-bold text-primary">{msg}</p>}

      <p className="mt-3 text-[11px] text-muted-foreground">{t.vehiclePhotosHint}</p>

      <div className="mt-2 space-y-2">
        {filtered.map((m) => {
          const busy = busyKey === keyOf(m);
          const photo = photoSrc(m.image);
          return (
            <div
              key={keyOf(m)}
              className="flex items-center gap-3 rounded-2xl border bg-card p-2.5 card-shadow"
            >
              <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-accent to-secondary">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Car className="h-6 w-6 text-primary/70" strokeWidth={1.4} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {m.make} {m.model}
                </p>
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Layers className="h-3 w-3" />
                  {t.variantsCount(m.variants)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() => trigger(m)}
                  disabled={busy}
                  className="flex items-center gap-1 rounded-lg border border-primary/40 px-2.5 py-1.5 text-[11px] font-bold text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {busy ? t.loading : photo ? t.changePhoto : t.choosePhoto}
                </button>
                {photo && (
                  <button
                    onClick={() => save(m.make, m.model, null)}
                    disabled={busy}
                    aria-label={t.removePhoto}
                    className="rounded-lg border border-destructive/30 p-1.5 text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            {t.noResults}
          </p>
        )}
      </div>
    </div>
  );
}
