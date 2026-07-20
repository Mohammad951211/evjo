"use client";

import { Logo } from "@/components/logo";
import { LangToggle } from "@/components/lang-toggle";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const STEPS = ["/onboarding/location", "/onboarding/vehicle", "/onboarding/profile"];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const step = STEPS.findIndex((s) => pathname.startsWith(s));

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10">
      <div className="flex items-center justify-between pt-6">
        <Logo className="text-2xl" />
        <LangToggle />
      </div>
      <div className="mt-6 flex gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>
      <div className="mt-8 flex-1">{children}</div>
    </div>
  );
}
