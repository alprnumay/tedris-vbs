import { LOGO_KATEGORILERI } from "@/lib/logo/logoKategoriler";
import type { LogoKategori } from "@/types/logoKimlik";
import { Shield, Type } from "lucide-react";

const IKON: Record<LogoKategori, typeof Shield> = {
  kurumsal_arma: Shield,
  monogram: Type,
};

interface Props {
  secili: LogoKategori | null;
  onSec: (k: LogoKategori) => void;
}

export function LogoKategoriSecimi({ secili, onSec }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {LOGO_KATEGORILERI.map((k) => {
        const aktif = secili === k.id;
        const Ikon = IKON[k.id];
        return (
          <button
            key={k.id}
            type="button"
            onClick={() => onSec(k.id)}
            className={[
              "rounded-2xl border-2 p-5 text-left transition",
              aktif
                ? "border-indigo-500 bg-indigo-50/80 shadow-md"
                : "border-slate-200 bg-white hover:border-indigo-200",
            ].join(" ")}
          >
            <div
              className={[
                "mb-3 flex h-12 w-12 items-center justify-center rounded-xl",
                aktif ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600",
              ].join(" ")}
            >
              <Ikon className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <h3 className="text-base font-bold text-slate-900">{k.ad}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{k.aciklama}</p>
          </button>
        );
      })}
    </div>
  );
}
