"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

export default function LocationStep() {
  const { t } = useI18n();
  const router = useRouter();
  const setLocation = useAppStore((s) => s.setLocation);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  function requestLocation() {
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        router.push("/onboarding/vehicle");
      },
      () => {
        setBusy(false);
        setDenied(true);
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  return (
    <div className="animate-slide-up text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-accent">
        <MapPin className="h-11 w-11 text-primary" />
      </div>
      <h1 className="mt-6 text-xl font-bold">{t.obLocationTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.obLocationBody}</p>
      {denied && <p className="mt-3 text-sm font-semibold text-amber-700">{t.obLocationDenied}</p>}
      <Button className="mt-8 w-full" size="lg" onClick={requestLocation} disabled={busy}>
        {busy ? t.loading : t.obLocationAllow}
      </Button>
      <Button
        variant="ghost"
        className="mt-2 w-full text-muted-foreground"
        onClick={() => router.push("/onboarding/vehicle")}
      >
        {t.obLocationSkip}
      </Button>
    </div>
  );
}
