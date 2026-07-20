import { cn } from "@/lib/utils";

/** EV.JO wordmark — bolt integrated into the dot. */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-baseline gap-0.5 font-bold tracking-tight", className)} dir="ltr">
      <span className="text-primary-dark">EV</span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[0.55em] w-[0.55em] translate-y-[0.02em] self-center"
        aria-hidden
      >
        <circle cx="12" cy="12" r="11" className="fill-[#1B7A4B]" />
        <path d="M13.2 5.5 8 13h3.4l-.8 5.5L16 11h-3.5l.7-5.5Z" fill="white" />
      </svg>
      {!compact && <span className="text-primary">JO</span>}
    </span>
  );
}
