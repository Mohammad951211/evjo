"use client";

import { SessionProvider } from "next-auth/react";
import { I18nProvider, type Locale } from "@/lib/i18n";

export function Providers({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <I18nProvider initialLocale={locale}>{children}</I18nProvider>
    </SessionProvider>
  );
}
