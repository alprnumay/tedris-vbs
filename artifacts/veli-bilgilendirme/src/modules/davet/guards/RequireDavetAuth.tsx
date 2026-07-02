import { useEffect, useState, type ReactNode } from "react";
import { BackButton } from "@/modules/davet/layout/ModulePageHeader";
import { api } from "@/lib/api";
import { AUTH_REQUIRED_EVENT } from "@/lib/backendApi";
import GirisEkrani from "@/components/GirisEkrani";
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

  useEffect(() => {
    const onAuthRequired = () => setStatus("denied");
    window.addEventListener(AUTH_REQUIRED_EVENT, onAuthRequired);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, onAuthRequired);
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
    return <GirisEkrani onGiris={() => setStatus("ok")} />;
  }

  return <>{children}</>;
}
