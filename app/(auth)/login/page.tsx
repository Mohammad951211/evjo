"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { normalizeJordanPhone } from "@/lib/phone";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [view, setView] = useState<"login" | "forgot">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // forgot-password sub-view
  const [rName, setRName] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rSent, setRSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalized = normalizeJordanPhone(phone);
    if (!normalized) {
      setError(t.phoneInvalid);
      return;
    }
    setBusy(true);
    const res = await signIn("credentials", { identifier: normalized, password, redirect: false });
    setBusy(false);
    if (res?.ok) return router.push("/home");
    if (res?.error === "PHONE_NOT_VERIFIED")
      return router.push(`/verify?phone=${encodeURIComponent(normalized)}`);
    setError(t.authError);
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalized = normalizeJordanPhone(rPhone);
    if (!rName.trim() || !normalized) {
      setError(t.phoneInvalid);
      return;
    }
    setBusy(true);
    await fetch("/api/auth/reset-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: rName, phone: normalized }),
    });
    setBusy(false);
    setRSent(true);
  }

  if (view === "forgot") {
    return (
      <Card className="animate-slide-up">
        <CardContent className="pt-6">
          {rSent ? (
            <div className="py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <p className="mt-4 text-sm font-semibold text-primary">{t.resetRequestSent}</p>
              <Button
                variant="outline"
                className="mt-6 w-full"
                onClick={() => {
                  setView("login");
                  setRSent(false);
                  setRName("");
                  setRPhone("");
                }}
              >
                {t.backToLogin}
              </Button>
            </div>
          ) : (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                <KeyRound className="h-7 w-7 text-primary" />
              </div>
              <h1 className="mt-4 text-center text-lg font-bold">{t.resetRequestTitle}</h1>
              <p className="mt-1 text-center text-sm text-muted-foreground">{t.resetRequestBody}</p>
              <form onSubmit={sendReset} className="mt-5 space-y-4">
                <div>
                  <Label htmlFor="r-name">{t.fullName}</Label>
                  <Input id="r-name" value={rName} onChange={(e) => setRName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="r-phone">{t.phone}</Label>
                  <Input
                    id="r-phone"
                    type="tel"
                    dir="ltr"
                    placeholder="07XXXXXXXX"
                    value={rPhone}
                    onChange={(e) => setRPhone(e.target.value)}
                    autoComplete="tel"
                    required
                  />
                </div>
                {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? t.loading : t.sendResetRequest}
                </Button>
              </form>
              <button
                onClick={() => { setView("login"); setError(null); }}
                className="mt-4 flex w-full items-center justify-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
                {t.backToLogin}
              </button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-up">
      <CardContent className="pt-6">
        <h1 className="mb-4 text-lg font-bold">{t.signIn}</h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="phone">{t.phone}</Label>
            <Input
              id="phone"
              type="tel"
              dir="ltr"
              placeholder="07XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t.password}</Label>
              <button
                type="button"
                onClick={() => { setView("forgot"); setError(null); }}
                className="mb-1.5 text-xs font-semibold text-primary hover:underline"
              >
                {t.forgotPassword}
              </button>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? t.loading : t.signIn}
          </Button>
        </form>
        <Link
          href="/signup"
          className="mt-4 block text-center text-sm font-semibold text-primary hover:underline"
        >
          {t.noAccount}
        </Link>
      </CardContent>
    </Card>
  );
}
