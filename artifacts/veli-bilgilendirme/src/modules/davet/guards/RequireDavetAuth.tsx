import { useEffect, useState, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/davet-ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/modules/davet/layout/ModulePageHeader";
import { LogIn, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { DavetLayout } from "@/modules/davet/layout/DavetLayout";

export function RequireDavetAuth({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((r) => {
        if (!cancelled) setStatus(r.user ? "ok" : "denied");
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
          <p className="text-sm text-muted-foreground">Oturum kontrol ediliyor…</p>
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
            <CardTitle>Giriş gerekli</CardTitle>
            <CardDescription>
              Okul takip modülünü kullanmak için hesabınızla giriş yapmalısınız.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild className="bg-violet-600 hover:bg-violet-700">
              <a href="/">
                <LogIn size={16} className="mr-2" />
                Giriş yap
              </a>
            </Button>
            <BackButton label="Nehari Platformu" href="/" />
          </CardContent>
        </Card>
      </DavetLayout>
    );
  }

  return <>{children}</>;
}
