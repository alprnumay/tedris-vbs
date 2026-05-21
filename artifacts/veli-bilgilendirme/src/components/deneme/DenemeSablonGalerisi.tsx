import type { DenemeSablonu } from "@/types/denemeSinavi";
import { demoPosterForm } from "@/lib/denemeOrnekVeri";
import { DenemeSinaviPreview } from "./DenemeSinaviPreview";
import { cn } from "@/lib/utils";

export const SABLON_GALERI_KARTLARI: { id: DenemeSablonu; ad: string; kisa: string }[] = [
  { id: "hero-odul", ad: "1. Hero ödül", kisa: "Tek büyük ödül alanı; sıralı kartlar ve güçlü hiyerarşi" },
  { id: "grid-odul", ad: "2. Grid ödül", kisa: "Çok ödül sıkı grid; sınıf ve tarih yan akış" },
  { id: "minimal", ad: "3. Minimal", kisa: "Ferah boşluk; ince çerçeve, sade tipografi" },
  { id: "kurumsal-sade", ad: "4. Kurumsal sade", kisa: "Logo + tarih önde; ödül ikinci planda" },
  { id: "premium-spotlight", ad: "5. Premium spotlight", kisa: "Podyum 1-2-3; altın vurgu" },
  { id: "enerjik-genclik", ad: "6. Enerjik gençlik", kisa: "Gradient + serbest yerleşim; İlk X enerjisi" },
  { id: "cta-odakli", ad: "7. CTA odaklı", kisa: "Kayıt çağrısı önde; havuz grid" },
  { id: "liste-odakli", ad: "8. Liste odaklı", kisa: "Havuz listesi ve çekiliş metni öne çıkar" },
  { id: "qr-odakli", ad: "9. QR odaklı", kisa: "Koyu zemin; QR ve ödül dengeli" },
  { id: "gorsel-odakli", ad: "10. Görsel odaklı", kisa: "Story oranı; kapak ve tipografi hero" },
];

type DenemeSablonGalerisiProps = {
  secili: DenemeSablonu;
  onSec: (id: DenemeSablonu) => void;
};

export function DenemeSablonGalerisi({ secili, onSec }: DenemeSablonGalerisiProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 md:px-6 md:py-6">
      <div className="mb-4 text-center md:mb-6">
        <h2 className="text-balance text-lg font-black tracking-tight text-slate-900 md:text-2xl">Şablon seç — hızlı başla</h2>
        <p className="mx-auto mt-2 max-w-xl text-pretty text-xs text-slate-600 md:text-sm">
          Her kartta örnek veriyle canlı küçük önizleme görürsünüz. Beğendiğiniz şablona tıklayıp düzenlemeye geçin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SABLON_GALERI_KARTLARI.map((k) => {
          const demo = demoPosterForm(k.id);
          const sec = secili === k.id;
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => onSec(k.id)}
              className={cn(
                "group flex w-full flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition duration-200",
                "hover:z-[1] hover:scale-[1.02] hover:shadow-xl",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                sec ? "border-indigo-600 ring-2 ring-indigo-400 ring-offset-2" : "border-slate-200 hover:border-indigo-300",
              )}
            >
              <div className="relative h-[200px] w-full overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200/90 md:h-[220px]">
                <div
                  className="pointer-events-none absolute left-1/2 top-0 origin-top -translate-x-1/2 scale-[0.24] md:scale-[0.26]"
                  style={{ width: 520 }}
                  aria-hidden
                >
                  <DenemeSinaviPreview data={demo} />
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5 border-t border-slate-100 px-3 py-3">
                <span className="text-sm font-extrabold text-slate-900">{k.ad}</span>
                <span className="line-clamp-2 text-[11px] leading-snug text-slate-500">{k.kisa}</span>
                {sec ? <span className="mt-1 text-[10px] font-bold text-indigo-600">Seçili</span> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function sablonGaleriAdi(id: DenemeSablonu): string {
  return SABLON_GALERI_KARTLARI.find((x) => x.id === id)?.ad ?? id;
}
