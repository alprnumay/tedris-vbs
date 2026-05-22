import type { AfisAlternatif } from "@/types/kolayAfis";
import { AILE_ADLARI } from "@/types/kolayAfis";
import { briefOlustur } from "@/lib/kolay-afis/afisBriefOlusturucu";
import { afisPosterBoyutlari } from "@/lib/kolay-afis/afisPosterBoyut";
import { AfisPosterRender } from "./AfisPosterRender";
import type { KolayAfisForm } from "@/types/kolayAfis";
const boyut = afisPosterBoyutlari();
const thumbScale = 0.22;

export function AfisSonucKartlari({
  form,
  alternatifler,
  seciliId,
  onSec,
  ikonluMaddeler,
}: {
  form: KolayAfisForm;
  alternatifler: AfisAlternatif[];
  seciliId: string | null;
  onSec: (id: string) => void;
  ikonluMaddeler: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-600">Size önerilen 3 alternatif</p>
      {alternatifler.map((alt) => {
        const secili = seciliId === alt.id;
        return (
          <button
            key={alt.id}
            type="button"
            onClick={() => onSec(alt.id)}
            className={[
              "w-full rounded-2xl border-2 p-3 text-left transition",
              secili ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 bg-white hover:border-indigo-300",
            ].join(" ")}
          >
            <div className="flex gap-3">
              <div
                className="shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-inner"
                style={{ width: boyut.width * thumbScale, height: boyut.minHeight * thumbScale }}
              >
                <div style={{ transform: `scale(${thumbScale})`, transformOrigin: "top left" }}>
                  <AfisPosterRender form={form} brief={briefOlustur(form, alt.varyant)} ikonluMaddeler={ikonluMaddeler} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-slate-900">{alt.baslik}</p>
                <p className="text-[10px] font-semibold text-indigo-700">{AILE_ADLARI[alt.aile]}</p>
                <p className="mt-1 text-xs text-slate-600">{alt.aciklama}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
