"use client";

import { useRouter } from "next/navigation";
import { VehiclePicker } from "@/components/vehicle-picker";
import { useI18n } from "@/lib/i18n";

export default function VehicleStep() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <div className="animate-slide-up">
      <h1 className="text-xl font-bold">{t.obVehicleTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.obVehicleBody}</p>
      <div className="mt-6">
        <VehiclePicker
          submitLabel={t.next}
          onSaved={() => router.push("/onboarding/profile")}
        />
      </div>
    </div>
  );
}
