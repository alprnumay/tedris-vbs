import { grupEtiketi, logoKalkanMi, logoYatayMi, LogoRenderer, templateTarzEtiketi } from "./render/LogoRenderer";
import { TEMPLATE_KISA_ETIKET } from "@/lib/logo/logoTemplates";
import type { LogoConfigV1 } from "@/types/logoKimlik";

interface Props {
  oneriler: LogoConfigV1[];
  seciliId: string | null;
  onSec: (config: LogoConfigV1) => void;
  onYenidenUret: () => void;
}

export function LogoOneriGrid({ oneriler, seciliId, onSec, onYenidenUret }: Props) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">4 premium logo şablonu</h2>
          <p className="text-sm text-slate-600">Elle tanımlı kurumsal şablonlar — rastgele üretim yok.</p>
        </div>
        <button
          type="button"
          onClick={onYenidenUret}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-200"
        >
          Renk varyasyonu
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {oneriler.map((cfg) => {
          const secili = seciliId === cfg.fingerprint;
          const yatay = logoYatayMi(cfg.templateId);
          const kalkan = logoKalkanMi(cfg.templateId);
          const previewW = yatay ? 620 : kalkan ? 300 : 320;

          return (
            <button
              key={cfg.fingerprint}
              type="button"
              onClick={() => onSec(cfg)}
              className={[
                "rounded-2xl border-2 bg-white text-left shadow-sm transition",
                yatay ? "lg:col-span-2" : "",
                secili ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200 hover:border-indigo-300 hover:shadow-md",
              ].join(" ")}
            >
              <div
                className={[
                  "flex items-center justify-center overflow-visible bg-gradient-to-b from-slate-50 to-white px-4 py-6 sm:px-6 sm:py-8",
                  yatay ? "min-h-[200px]" : kalkan ? "min-h-[380px]" : "min-h-[300px]",
                ].join(" ")}
              >
                <LogoRenderer
                  config={cfg}
                  size={previewW}
                  className={
                    yatay
                      ? "mx-auto h-auto w-full max-w-[620px]"
                      : kalkan
                        ? "mx-auto h-auto w-full max-w-[300px]"
                        : "mx-auto h-auto w-full max-w-[320px]"
                  }
                />
              </div>
              <div className="border-t border-slate-100 px-4 py-3">
                <p className="text-sm font-bold text-indigo-900">{templateTarzEtiketi(cfg)}</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  {TEMPLATE_KISA_ETIKET[cfg.templateId]} · {grupEtiketi(cfg.groupLabel)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
