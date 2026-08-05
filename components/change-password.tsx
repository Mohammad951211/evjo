"use client";

import { useState } from "react";
import { KeyRound, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";

/** Self-service password change, collapsed by default in the Profile screen. */
export function ChangePassword() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 6) {
      setMsg({ ok: false, text: t.passwordTooShort });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: t.passwordChanged });
      setCurrent("");
      setNext("");
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg({ ok: false, text: d.error === "wrong_current" ? t.wrongCurrentPassword : t.passwordTooShort });
    }
  }

  return (
    <Card className="mt-4">
      <CardContent className="pt-4">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-3"
          aria-expanded={open}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
            <KeyRound className="h-4 w-4" />
          </span>
          <span className="flex-1 text-start text-sm font-bold">{t.changePassword}</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <div>
              <Label htmlFor="cur-pw">{t.currentPassword}</Label>
              <Input
                id="cur-pw"
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="new-pw">{t.newPassword}</Label>
              <Input
                id="new-pw"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
              />
            </div>
            {msg && (
              <p className={`text-sm font-semibold ${msg.ok ? "text-primary" : "text-destructive"}`}>
                {msg.text}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy || !current || !next}>
              {busy ? t.loading : t.save}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
