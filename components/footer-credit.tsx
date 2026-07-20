"use client";

import { useI18n } from "@/lib/i18n";

export function FooterCredit() {
  const { t } = useI18n();
  return (
    <footer className="px-5 pb-28 pt-6 text-center text-xs text-muted-foreground">
      <a
        href="https://malghweri.site/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-primary hover:underline"
      >
        {t.developedBy}
      </a>
    </footer>
  );
}
