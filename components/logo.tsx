"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

/** اشحن / Eshhan wordmark — bolt mark + locale-aware name + .jo tag. */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  const { locale } = useI18n();
  const name = locale === "ar" ? "اشحن" : "Eshhan";

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 font-bold tracking-tight", className)}
      dir="ltr"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[0.9em] w-[0.9em] shrink-0"
        aria-hidden
      >
        <circle cx="12" cy="12" r="11" className="fill-[#1B7A4B]" />
        <path d="M13.2 5.5 8 13h3.4l-.8 5.5L16 11h-3.5l.7-5.5Z" fill="white" />
      </svg>
      <span className="text-primary-dark">{name}</span>
      {!compact && <span className="text-primary text-[0.72em] font-bold">.jo</span>}
    </span>
  );
}
