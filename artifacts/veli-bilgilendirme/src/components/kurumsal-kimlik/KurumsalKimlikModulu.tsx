import { useRef, useState } from "react";
import type { KullaniciBilgisi } from "@/lib/api";
import { logoOnerileriUret, sonrakiVaryasyonIndex } from "@/lib/logo/logoMotor";
import { logoToPng, pngIndir } from "@/lib/logo/logoPngExport";
import { LOGO_KATEGORILERI } from "@/lib/logo/logoKategoriler";
import type { LogoConfigV1, LogoModulAsama, LogoSihirbazForm as LogoFormState } from "@/types/logoKimlik";
import { bosLogoSihirbazForm } from "@/types/logoKimlik";
import { LogoKategoriSecimi } from "./LogoKategoriSecimi";
import { LogoSihirbazForm as LogoSihirbazFormPanel } from "./LogoSihirbazForm";
import { LogoOneriGrid } from "./LogoOneriGrid";
import { LogoOnizleme } from "./LogoOnizleme";
import { LogoIndirmePaneli } from "./LogoIndirmePaneli";
import { logoKalkanMi, logoYatayMi, LogoRenderer } from "./render/LogoRenderer";

export interface KurumsalKimlikModuluProps {
  kullanici: KullaniciBilgisi;
  onAnaSayfa: () => void;
  onDestek: () => void;
  onCikis: () => void;
}

export function KurumsalKimlikModulu({ kullanici, onAnaSayfa, onDestek, onCikis }: KurumsalKimlikModuluProps) {
  const [asama, setAsama] = useState<LogoModulAsama>("kategori");
  const [form, setForm] = useState<LogoFormState>(bosLogoSihirbazForm);
  const [oneriler, setOneriler] = useState<LogoConfigV1[]>([]);
  const [secili, setSecili] = useState<LogoConfigV1 | null>(null);
  const [uretiliyor, setUretiliyor] = useState(false);
  const [varyasyonIndex, setVaryasyonIndex] = useState(0);
  const [indiriliyor, setIndiriliyor] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const kategoriSec = (id: LogoFormState["kategori"]) => {
    const meta = LOGO_KATEGORILERI.find((k) => k.id === id);
    setForm((f) => ({
      ...f,
      kategori: id,
      gorselYon: meta?.varsayilanYon ?? f.gorselYon,
    }));
    setAsama("form");
  };

  const onerileriUret = () => {
    setUretiliyor(true);
    setVaryasyonIndex(0);
    requestAnimationFrame(() => {
      const list = logoOnerileriUret(form, 0);
      setOneriler(list);
      setSecili(null);
      setAsama("oneriler");
      setUretiliyor(false);
    });
  };

  const yenidenUret = () => {
    const next = sonrakiVaryasyonIndex(varyasyonIndex);
    setVaryasyonIndex(next);
    setOneriler(logoOnerileriUret(form, next));
    setSecili(null);
  };

  const secimYap = (cfg: LogoConfigV1) => {
    setSecili(cfg);
    setAsama("secim");
  };

  const anaPngIndir = async () => {
    if (!exportRef.current || !secili) return;
    setIndiriliyor(true);
    try {
      const dataUrl = await logoToPng(exportRef.current, secili.palette.accent);
      const ad = (secili.organization.kisaAd || secili.organization.kurumAdi || "logo")
        .replace(/\s+/g, "-")
        .toLowerCase();
      pngIndir(dataUrl, `nehari-logo-${ad}.png`);
    } finally {
      setIndiriliyor(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-3 py-3 text-white sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onAnaSayfa}
            className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-2.5 py-2 text-xs font-bold hover:bg-white/20"
          >
            ← Ana
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold sm:text-base">Logo / Kurumsal Kimlik</h1>
            <p className="truncate text-[10px] text-white/60 sm:text-xs">{kullanici.name}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onDestek}
            className="rounded-lg border border-white/20 px-2.5 py-2 text-[11px] font-semibold hover:bg-white/10"
          >
            Destek
          </button>
          <button
            type="button"
            onClick={onCikis}
            className="rounded-lg border border-white/15 px-2.5 py-2 text-[11px] font-semibold text-white/90"
          >
            Çıkış
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-3 py-6 sm:px-6 sm:py-8">
        {asama === "kategori" && (
          <div className="mx-auto max-w-3xl">
            <p className="mb-6 text-center text-sm text-slate-600">
              4 premium şablon önizlemesi — geliştirme sürümü. Ana ekranda modül henüz kullanıcılara kapalıdır.
            </p>
            <LogoKategoriSecimi secili={form.kategori} onSec={kategoriSec} />
          </div>
        )}

        {asama === "form" && (
          <>
            <button
              type="button"
              onClick={() => setAsama("kategori")}
              className="mb-4 text-sm font-semibold text-indigo-600 hover:underline"
            >
              ← Kategori değiştir
            </button>
            <LogoSihirbazFormPanel form={form} onChange={setForm} onUret={onerileriUret} uretiliyor={uretiliyor} />
          </>
        )}

        {asama === "oneriler" && (
          <LogoOneriGrid
            oneriler={oneriler}
            seciliId={secili?.fingerprint ?? null}
            onSec={secimYap}
            onYenidenUret={yenidenUret}
          />
        )}

        {asama === "secim" && secili && (
          <div className="mx-auto max-w-5xl space-y-6">
            <button
              type="button"
              onClick={() => setAsama("oneriler")}
              className="text-sm font-semibold text-indigo-600 hover:underline"
            >
              ← Önerilere dön
            </button>
            <LogoOnizleme config={secili} />
            <LogoIndirmePaneli onAnaPngIndir={anaPngIndir} indiriliyor={indiriliyor} />
            <p className="text-center text-[11px] text-slate-500">
              Tasarımlar yalnızca tarayıcınızda üretilir; bu demo sürümde sunucuya kaydedilmez.
            </p>
          </div>
        )}
      </main>

      {secili && (
        <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden>
          <div
            ref={exportRef}
            style={{
              width: logoYatayMi(secili.templateId) ? 900 : logoKalkanMi(secili.templateId) ? 720 : 512,
              height: logoYatayMi(secili.templateId) ? 300 : logoKalkanMi(secili.templateId) ? 920 : 512,
              background: secili.palette.accent,
            }}
          >
            <LogoRenderer
              config={secili}
              size={logoYatayMi(secili.templateId) ? 900 : logoKalkanMi(secili.templateId) ? 720 : 512}
            />
          </div>
        </div>
      )}
    </div>
  );
}

