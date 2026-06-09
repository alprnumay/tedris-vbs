import { useEffect, useState, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/davet-ui/card";
import { BackButton } from "@/modules/davet/layout/ModulePageHeader";
import { ShieldAlert } from "lucide-react";
import { api, type KullaniciBilgisi } from "@/lib/api";
import { DavetLayout } from "@/modules/davet/layout/DavetLayout";

function isDavetAdmin(user: KullaniciBilgisi | null | undefined): boolean {
  if (!user) return false;
  const role = String(user.role ?? "").toLowerCase();
  return Boolean(user.isAdmin) || role === "admin" || role === "super_admin";
}

export function RequireDavetAdmin({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((r) => {
        if (!cancelled) setStatus(isDavetAdmin(r.user) ? "ok" : "denied");
      })
      .catch(() => {
        if (!cancelled) setStatus("denied");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <DavetLayout>
        <div className="space-y-4">
          <BackButton label="Nehari Platformu" href="/" />
          <p className="text-sm text-muted-foreground">Yetki kontrol ediliyor…</p>
        </div>
      </DavetLayout>
    );
  }

  if (status === "denied") {
    return (
      <DavetLayout>
        <Card className="max-w-lg border-border">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-amber-600">
              <ShieldAlert size={24} />
            </div>
            <CardTitle>Çalışma Onayı</CardTitle>
            <CardDescription>Bu alan yalnızca yetkili kullanıcılar içindir.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <BackButton label="Nehari Platformu" href="/" />
          </CardContent>
        </Card>
      </DavetLayout>
    );
  }

  return <>{children}</>;
}
