"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { ar, type Dict } from "./ar";
import { en } from "./en";

export type Locale = "ar" | "en";

const dicts: Record<Locale, Dict> = { ar, en };

interface I18nCtx {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: Dict;
  setLocale: (l: Locale) => void;
}

const Ctx = createContext<I18nCtx>({
  locale: "ar",
  dir: "rtl",
  t: ar,
  setLocale: () => {},
});

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `locale=${l};path=/;max-age=31536000;samesite=lax`;
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  }, []);

  return (
    <Ctx.Provider
      value={{ locale, dir: locale === "ar" ? "rtl" : "ltr", t: dicts[locale], setLocale }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useI18n() {
  return useContext(Ctx);
}
