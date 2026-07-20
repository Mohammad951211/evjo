"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { OtpStep } from "@/components/otp-step";
import { useI18n } from "@/lib/i18n";

function VerifyInner() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";

  if (!phone) {
    router.replace("/login");
    return null;
  }

  return (
    <Card className="animate-slide-up">
      <CardContent className="pt-6">
        <p className="mb-2 text-center text-sm font-semibold text-amber-700">
          {t.phoneNotVerified}
        </p>
        <OtpStep phone={phone} onVerified={() => router.push("/login")} />
      </CardContent>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
