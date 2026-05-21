import { grupEtiketi, LogoRenderer } from "./render/LogoRenderer";
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
          <h2 className="text-lg font-bold text-slate-900">12 logo önerisi</h2>
          <p className="text-sm text-slate-600">Bir tasarım seçin; ardından önizleme ve indirme adımına geçin.</p>
        </div>
        <button
          type="button"
          onClick={onYenidenUret}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-200"
        >
          Yeniden üret
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {oneriler.map((cfg) => {
          const secili = seciliId === cfg.fingerprint;
          return (
            <button
              key={cfg.fingerprint}
              type="button"
              onClick={() => onSec(cfg)}
              className={[
                "overflow-hidden rounded-2xl border-2 bg-white text-left transition",
                secili ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200 hover:border-indigo-300",
              ].join(" ")}
            >
              <div className="aspect-square bg-slate-50 p-2">
                <LogoRenderer config={cfg} size={160} className="mx-auto h-full w-full" />
              </div>
              <div className="border-t border-slate-100 px-2 py-2">
                <p className="truncate text-[10px] font-bold text-indigo-700">{grupEtiketi(cfg.groupLabel)}</p>
                <p className="truncate text-[9px] text-slate-500">{cfg.variant.shapeId.replace(/_/g, " ")}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
