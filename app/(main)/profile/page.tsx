"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { User, LogOut, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { LangToggle } from "@/components/lang-toggle";
import { useI18n } from "@/lib/i18n";
import { JO_CITIES } from "@/lib/geo";

interface ProfileData {
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  createdAt: string;
  isAdmin?: boolean;
  meterType: "EV_METER" | "SERVICES_METER" | null;
  homeChargerKw: number | null;
  servicesTier: number | null;
}

export default function ProfilePage() {
  const { t, locale, dir } = useI18n();
  const [p, setP] = useState<ProfileData | null>(null);
  const [savedNote, setSavedNote] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setP(d.user));
  }, []);

  async function patch(update: Partial<ProfileData>) {
    setP((prev) => (prev ? { ...prev, ...update } : prev));
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2000);
  }

  if (!p) {
    return <p className="px-5 pt-10 text-center text-sm text-muted-foreground">{t.loading}</p>;
  }

  return (
    <div className="animate-slide-up pt-2">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <User className="h-5 w-5 text-primary" />
          {t.profileTitle}
        </h1>
        {savedNote && <span className="text-xs font-bold text-primary">{t.updated} ✓</span>}
      </div>

      <Card className="mt-4">
        <CardContent className="pt-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
              {p.name?.charAt(0) ?? "؟"}
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold">{p.name}</p>
              <p className="num text-xs text-muted-foreground" dir="ltr">
                {p.email ?? p.phone ?? ""}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t.memberSince}{" "}
                {new Date(p.createdAt).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-GB", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <Label>{t.fullName}</Label>
              <Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} onBlur={() => patch({ name: p.name })} />
            </div>
            <div>
              <Label>{t.city}</Label>
              <Select value={p.city ?? "amman"} onChange={(e) => patch({ city: e.target.value })}>
                {JO_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {locale === "ar" ? c.nameAr : c.nameEn}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
              <span className="text-sm font-semibold">{t.language}</span>
              <LangToggle />
            </div>
          </div>
        </CardContent>
      </Card>

      {p.isAdmin && (
        <Link href="/admin" className="mt-4 block">
          <Card className="border-primary/30 transition-colors hover:border-primary/60">
            <CardContent className="flex items-center gap-3 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{t.adminPanel}</span>
                <span className="block text-[11px] text-muted-foreground">{t.adminTitle}</span>
              </span>
              {dir === "rtl" ? (
                <ChevronLeft className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
              )}
            </CardContent>
          </Card>
        </Link>
      )}

      <Button
        variant="outline"
        className="mt-4 w-full text-destructive hover:bg-destructive/5"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut />
        {t.signOut}
      </Button>
    </div>
  );
}
