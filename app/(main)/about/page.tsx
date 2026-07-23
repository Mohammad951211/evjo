"use client";

import { Info, Database, Coins } from "lucide-react";
import { Logo } from "@/components/logo";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

const APP_VERSION = "1.0.0";

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <div className="animate-slide-up mx-auto max-w-md pt-2">
      <h1 className="flex items-center gap-2 text-lg font-bold">
        <Info className="h-5 w-5 text-primary" />
        {t.aboutTitle}
      </h1>

      <Card className="mt-4">
        <CardContent className="pt-6 text-center">
          <Logo className="text-4xl" />
          <p className="mt-2 text-sm font-medium text-muted-foreground">{t.tagline}</p>
          <p className="num mt-3 text-xs text-muted-foreground">
            {t.aboutVersion} {APP_VERSION}
          </p>
        </CardContent>
      </Card>

      <Card className="mt-3">
        <CardContent className="space-y-3 pt-5 text-sm">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-bold">{t.aboutDataSources}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t.aboutDataNote}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 border-t pt-3">
            <Coins className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">{t.aboutTariffNote}</p>
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-center">
        <a
          href="https://malghweri.site/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-primary hover:underline"
        >
          {t.developedBy}
        </a>
      </p>
    </div>
  );
}
