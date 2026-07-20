"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { OtpStep } from "@/components/otp-step";
import { useI18n } from "@/lib/i18n";
import { normalizeJordanPhone } from "@/lib/phone";

export default function SignupPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalized = normalizeJordanPhone(phone);
    if (!normalized) {
      setError(t.phoneInvalid);
      return;
    }

    setBusy(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone: normalized, password }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setError(d.error === "invalid_phone" ? t.phoneInvalid : t.signupError);
      return;
    }
    setNormalizedPhone(normalized);
    if (d.otpRequired) {
      setBusy(false);
      setStep("otp");
      return;
    }
    // OTP disabled — account is active, sign in straight away
    const login = await signIn("credentials", {
      identifier: normalized,
      password,
      redirect: false,
    });
    setBusy(false);
    if (login?.ok) router.push("/onboarding/location");
    else router.push("/login");
  }

  async function onVerified() {
    // phone is verified — sign in with the credentials from this session
    const login = await signIn("credentials", {
      identifier: normalizedPhone,
      password,
      redirect: false,
    });
    if (login?.ok) router.push("/onboarding/location");
    else router.push("/login");
  }

  return (
    <Card className="animate-slide-up">
      <CardContent className="pt-6">
        {step === "otp" ? (
          <OtpStep phone={normalizedPhone} onVerified={onVerified} />
        ) : (
          <>
            <h1 className="mb-4 text-lg font-bold">{t.signUp}</h1>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t.fullName}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
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
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
              </div>
              {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? t.loading : t.signUp}
              </Button>
            </form>
            <Link
              href="/login"
              className="mt-4 block text-center text-sm font-semibold text-primary hover:underline"
            >
              {t.haveAccount}
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
