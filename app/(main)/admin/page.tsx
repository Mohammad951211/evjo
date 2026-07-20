"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Users, Car, Zap, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { JO_CITIES } from "@/lib/geo";

interface AdminUser {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  phoneVerified: boolean;
  isAdmin: boolean;
  onboarded: boolean;
  createdAt: string;
  vehicles: number;
  sessions: number;
}

export default function AdminPage() {
  const { t, locale } = useI18n();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => {
        if (r.status === 403 || r.status === 401) {
          setForbidden(true);
          return null;
        }
        return r.json();
      })
      .then((d) => d && setUsers(d.users ?? []))
      .catch(() => setForbidden(true));
  }, []);

  const cityName = (id: string | null) => {
    if (!id) return "—";
    const c = JO_CITIES.find((x) => x.id === id);
    return c ? (locale === "ar" ? c.nameAr : c.nameEn) : id;
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (forbidden) {
    return (
      <div className="animate-slide-up pt-2">
        <p className="mt-10 rounded-2xl border border-dashed py-14 text-center text-sm font-semibold text-muted-foreground">
          {t.adminForbidden}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-slide-up pt-2">
      <h1 className="flex items-center gap-2 text-lg font-bold">
        <ShieldCheck className="h-5 w-5 text-primary" />
        {t.adminTitle}
      </h1>

      {users === null ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          {/* Total */}
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground card-shadow">
            <Users className="h-8 w-8 shrink-0 opacity-90" />
            <div>
              <p className="num text-2xl font-bold leading-none">{users.length}</p>
              <p className="text-xs text-primary-foreground/80">{t.totalUsers(users.length)}</p>
            </div>
          </div>

          {users.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed py-14 text-center text-sm text-muted-foreground">
              {t.adminNoUsers}
            </p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {users.map((u) => (
                <Card key={u.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold">{u.name}</p>
                          {u.isAdmin && <Badge variant="default">{t.adminBadge}</Badge>}
                        </div>
                        <p className="num mt-0.5 text-xs text-muted-foreground" dir="ltr">
                          {u.phone ?? u.email ?? "—"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {cityName(u.city)}
                        </p>
                      </div>
                      <Badge variant={u.phoneVerified ? "success" : "warning"} className="shrink-0">
                        {u.phoneVerified ? (
                          <><CheckCircle2 className="h-3 w-3" /> {t.verifiedShort}</>
                        ) : (
                          <><Clock className="h-3 w-3" /> {t.unverifiedShort}</>
                        )}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
                      <span className="num">{fmt(u.createdAt)}</span>
                      <span className="flex items-center gap-3">
                        <span className="num flex items-center gap-1">
                          <Car className="h-3.5 w-3.5" /> {u.vehicles}
                        </span>
                        <span className="num flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5" /> {u.sessions}
                        </span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
