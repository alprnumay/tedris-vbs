import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/davet-ui/card";
import { Button } from "@/components/davet-ui/button";
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
        <p className="text-sm text-muted-foreground">Yetki kontrol ediliyor…</p>
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
          <CardContent>
            <Link href="/">
              <Button variant="outline">Nehari ana sayfaya dön</Button>
            </Link>
          </CardContent>
        </Card>
      </DavetLayout>
    );
  }

  return <>{children}</>;
}
