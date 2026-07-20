"use client";

import { Logo } from "@/components/logo";
import { LangToggle } from "@/components/lang-toggle";
import { FooterCredit } from "@/components/footer-credit";
import { useI18n } from "@/lib/i18n";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <div className="flex items-center justify-between pt-8">
        <span />
        <LangToggle />
      </div>
      <div className="mt-10 text-center">
        <Logo className="text-5xl" />
        <p className="mt-2 text-sm font-medium text-muted-foreground">{t.tagline}</p>
      </div>
      <div className="mt-8 flex-1">{children}</div>
      <FooterCredit />
    </div>
  );
}
