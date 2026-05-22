import { ARKA_PLANLAR, arkaPlanStil, sablonArkaPlanOnerileri } from "@/lib/yatili-program/yatiliArkaPlanlar";
import { yatiliTemaAl } from "@/lib/yatili-program/yatiliTema";
import {
  YATILI_RENK_TEMALARI,
  YATILI_SABLON_META,
  type YatiliArkaPlanId,
  type YatiliGorselModu,
  type YatiliProgramFormData,
} from "@/types/yatiliProgram";
import { YatiliSablonThumb } from "./YatiliSablonThumb";

const GORSEL_MODLARI: { id: YatiliGorselModu; ad: string; kisa: string }[] = [
  { id: "buyuk_kapak", ad: "Büyük kapak", kisa: "Ana görsel üstte" },
  { id: "kucuk_destek", ad: "Küçük destek", kisa: "Yan destek görseli" },
  { id: "gorselsiz", ad: "Görselsiz", kisa: "Kurumsal dekor" },
];

const EK_ARKA_PLANLAR: YatiliArkaPlanId[] = ["sicak_gradient", "geometrik", "gece_doku", "premium_gorselsiz"];

export function YatiliSablonSecici({
  form,
  onChange,
}: {
  form: YatiliProgramFormData;
  onChange: (next: YatiliProgramFormData) => void;
}) {
  const onerilenArkaPlanlar = sablonArkaPlanOnerileri(form.sablon);
  const arkaPlanSecenekleri = [...new Set([...onerilenArkaPlanlar, ...EK_ARKA_PLANLAR])].filter((id) => ARKA_PLANLAR[id]);

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-extrabold text-slate-800">Şablon seçin</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {YATILI_SABLON_META.map((s) => {
            const secili = form.sablon === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  onChange({
                    ...form,
                    sablon: s.id,
                    arkaPlanId: sablonArkaPlanOnerileri(s.id)[0] ?? form.arkaPlanId,
                  })
                }
                className={[
                  "overflow-hidden rounded-2xl border-2 text-left transition active:scale-[0.99]",
                  secili
                    ? "border-indigo-500 bg-indigo-50/50 shadow-lg ring-4 ring-indigo-100"
                    : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md",
                ].join(" ")}
              >
                <div
                  className="flex items-center justify-center border-b border-slate-100 bg-slate-50 py-3"
                  style={{ borderTop: secili ? `4px solid ${s.temaRenk}` : undefined }}
                >
                  <YatiliSablonThumb sablon={s.id} secili={secili} />
                </div>
                <div className="p-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-xs font-extrabold text-slate-900">{s.ad}</p>
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
                      style={{ background: s.temaRenk }}
                    >
                      {s.his}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] font-semibold text-indigo-700">Öne çıkan: {s.oneCikan}</p>
                  <p className="text-[10px] text-slate-500">Uygun: {s.uygun}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Görsel kullanımı</p>
        <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
          {GORSEL_MODLARI.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() =>
                onChange({
                  ...form,
                  gorselModu: g.id,
                  bloklar: { ...form.bloklar, gorsel: g.id !== "gorselsiz" },
                })
              }
              className={[
                "flex-1 rounded-lg px-2 py-2.5 text-center transition",
                form.gorselModu === g.id ? "bg-white text-indigo-800 shadow-sm" : "text-slate-600 hover:text-slate-800",
              ].join(" ")}
            >
              <span className="block text-[11px] font-bold">{g.ad}</span>
              <span className="block text-[9px] opacity-70">{g.kisa}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Renk teması</p>
        <div className="grid grid-cols-2 gap-2">
          {YATILI_RENK_TEMALARI.map((t) => {
            const tema = yatiliTemaAl(t.id);
            const secili = form.renkTema === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange({ ...form, renkTema: t.id })}
                className={[
                  "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition",
                  secili ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 bg-white hover:border-indigo-200",
                ].join(" ")}
              >
                <span className="flex shrink-0 gap-0.5">
                  <span className="h-5 w-5 rounded-full border border-white shadow" style={{ background: tema.primary }} />
                  <span className="h-5 w-5 rounded-full border border-white shadow -ml-2" style={{ background: tema.accent }} />
                </span>
                <span className="text-[11px] font-bold text-slate-800">{t.ad}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Arka plan</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {arkaPlanSecenekleri.map((id) => {
            const tema = yatiliTemaAl(form.renkTema);
            const dark = id === "gece_doku" || id === "premium_gorselsiz";
            const stil = arkaPlanStil(id, tema, dark);
            const secili = form.arkaPlanId === id;
            const onerilen = onerilenArkaPlanlar.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ ...form, arkaPlanId: id })}
                className={[
                  "overflow-hidden rounded-xl border-2 text-left transition",
                  secili ? "border-indigo-500 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300",
                ].join(" ")}
              >
                <div
                  className="h-12 w-full"
                  style={{ background: stil.zemin }}
                  aria-hidden
                />
                <p className="px-2 py-1.5 text-[10px] font-semibold text-slate-700">
                  {ARKA_PLANLAR[id].ad}
                  {onerilen ? <span className="ml-1 text-indigo-600">★</span> : null}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
