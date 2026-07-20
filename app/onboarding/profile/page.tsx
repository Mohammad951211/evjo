"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { JO_CITIES } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";

export default function ProfileStep() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("amman");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.name) setName(d.user.name);
        if (d.user?.city) setCity(d.user.city);
      })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, city, onboarded: true }),
    });
    router.push("/home");
  }

  return (
    <div className="animate-slide-up">
      <h1 className="text-xl font-bold">{t.obProfileTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.obProfileBody}</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="name">{t.fullName}</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label>{t.city}</Label>
          <Select value={city} onChange={(e) => setCity(e.target.value)}>
            {JO_CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {locale === "ar" ? c.nameAr : c.nameEn}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy ? t.loading : t.goHome}
        </Button>
      </form>
    </div>
  );
}
