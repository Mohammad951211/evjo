"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Light/dark switch — persists to localStorage, applied pre-paint by the layout script. */
export function ThemeToggle() {
  const { t } = useI18n();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
      aria-label={t.appearance}
    >
      {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      {dark ? t.themeLight : t.themeDark}
    </button>
  );
}
