"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { normalizeJordanPhone } from "@/lib/phone";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
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
    const res = await signIn("credentials", {
      identifier: normalized,
      password,
      redirect: false,
    });
    setBusy(false);
    if (res?.ok) {
      router.push("/home");
      return;
    }
    if (res?.error === "PHONE_NOT_VERIFIED") {
      router.push(`/verify?phone=${encodeURIComponent(normalized)}`);
      return;
    }
    setError(t.authError);
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
            <Label htmlFor="password">{t.password}</Label>
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
