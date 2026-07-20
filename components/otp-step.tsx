"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";

const RESEND_SECONDS = 60;

/**
 * Sends an OTP to `phone` on mount and verifies the 6-digit code the
 * user types. In dev (no SMS gateway) the API returns the code and it
 * is shown inline so the flow stays testable.
 */
export function OtpStep({
  phone,
  onVerified,
}: {
  phone: string;
  onVerified: () => void;
}) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const sentOnce = useRef(false);

  const send = useCallback(async () => {
    setError(false);
    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.devCode) setDevCode(d.devCode);
    // stay in sync with the server-side cooldown when rate-limited
    setCooldown(res.status === 429 && d.retryIn ? d.retryIn : RESEND_SECONDS);
  }, [phone]);

  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    send();
  }, [send]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    setBusy(false);
    if (res.ok) onVerified();
    else setError(true);
  }

  return (
    <div className="animate-slide-up">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
        <ShieldCheck className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mt-4 text-center text-lg font-bold">{t.otpTitle}</h2>
      <p className="num mt-1 text-center text-sm text-muted-foreground" dir="ltr">
        {t.otpBody(phone)}
      </p>

      {devCode && (
        <p className="num mt-3 rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-800">
          {t.otpDevHint(devCode)}
        </p>
      )}

      <form onSubmit={verify} className="mt-5 space-y-4">
        <div>
          <Label htmlFor="otp">{t.otpCodeLabel}</Label>
          <Input
            id="otp"
            dir="ltr"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            placeholder="••••••"
            className="num text-center text-2xl font-bold tracking-[0.5em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
          />
        </div>
        {error && <p className="text-sm font-semibold text-destructive">{t.otpInvalid}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={busy || code.length !== 6}>
          {busy ? t.loading : t.otpVerify}
        </Button>
      </form>

      <button
        onClick={send}
        disabled={cooldown > 0}
        className="mt-4 w-full text-center text-sm font-semibold text-primary disabled:text-muted-foreground"
      >
        {cooldown > 0 ? t.otpResendIn(cooldown) : t.otpResend}
      </button>
    </div>
  );
}
