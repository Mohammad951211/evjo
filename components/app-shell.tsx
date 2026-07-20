"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Car, User, Zap, Bell, Route } from "lucide-react";
import { Logo } from "@/components/logo";
import { LangToggle } from "@/components/lang-toggle";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DOCK = [
  { href: "/home", icon: Home, key: "navHome" },
  { href: "/stations", icon: MapPin, key: "navStations" },
  null, // link-session accent slot
  { href: "/trip", icon: Route, key: "navTrip" },
  { href: "/garage", icon: Car, key: "navGarage" },
] as const;

/** App-style shell: centered phone-width column on every screen size. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <div className="mx-auto min-h-dvh max-w-md">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur">
        <Link href="/home" aria-label={t.navHome} className="rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Logo className="text-2xl" />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            aria-label={t.navNotifications}
            className={cn(
              "rounded-full border bg-card p-2 transition-colors",
              pathname.startsWith("/notifications") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Bell className="h-4 w-4" />
          </Link>
          <Link
            href="/profile"
            aria-label={t.navProfile}
            className={cn(
              "rounded-full border bg-card p-2 transition-colors",
              pathname.startsWith("/profile") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <User className="h-4 w-4" />
          </Link>
          <LangToggle />
        </div>
      </header>

      <main className="px-4 pb-4 pt-4">{children}</main>

      <footer className="pb-28 pt-2 text-center">
        <a
          href="https://malghweri.site/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          {t.developedBy}
        </a>
      </footer>

      {/* Bottom bar — merged with the screen edge */}
      <nav className="fixed inset-x-0 bottom-0 z-40" aria-label="Main">
        <div className="mx-auto max-w-md border-t bg-card/95 backdrop-blur">
          <div className="flex items-end justify-between px-4 pb-[max(env(safe-area-inset-bottom),10px)] pt-2">
            {DOCK.map((item) =>
              item === null ? (
                <Link
                  key="charging"
                  href="/sessions"
                  aria-label={t.navCharging}
                  className="flex min-w-14 flex-col items-center gap-0.5"
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-white transition-colors"
                    style={{
                      backgroundColor: pathname.startsWith("/sessions") ? "#0C3B24" : "#1B7A4B",
                    }}
                  >
                    <Zap className="h-5 w-5" fill="currentColor" />
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-semibold",
                      pathname.startsWith("/sessions") ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {t.navCharging}
                  </span>
                </Link>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[9px] font-semibold transition-colors",
                    pathname.startsWith(item.href)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon
                    className="h-5 w-5"
                    strokeWidth={pathname.startsWith(item.href) ? 2.4 : 2}
                  />
                  {t[item.key]}
                </Link>
              )
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
