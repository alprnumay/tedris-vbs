import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { BLOK_LISTESI, vurguOdagiUygula, yogunlukModuUygula } from "@/lib/yatili-program/yatiliBloklar";
import { vurguSablonOnerisi } from "@/lib/yatili-program/yatiliLayoutMotor";
import type { YatiliBlokId, YatiliProgramFormData, YatiliYogunlukModu } from "@/types/yatiliProgram";
import { YATILI_INCE_AYAR_BLOKLARI, YATILI_YOGUNLUK_MODLARI } from "@/types/yatiliProgram";
import { OtomatikMetinEditoru } from "./OtomatikMetinEditoru";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

function yogunlukGorselModu(mod: YatiliYogunlukModu): YatiliProgramFormData["gorselModu"] {
  if (mod === "gorsel_odakli") return "buyuk_kapak";
  if (mod === "veli_odakli") return "gorselsiz";
  if (mod === "sade") return "buyuk_kapak";
  return "kucuk_destek";
}

export function YatiliBlokPaneli({
  form,
  onChange,
  onOtomatikDoldur,
}: {
  form: YatiliProgramFormData;
  onChange: (next: YatiliProgramFormData) => void;
  onOtomatikDoldur: () => void;
}) {
  const [inceAyarAcik, setInceAyarAcik] = useState(false);

  const blokToggle = (id: YatiliBlokId, acik: boolean) => {
    const bloklar = { ...form.bloklar, [id]: acik };
    let gorselModu = form.gorselModu;
    if (id === "gorsel" && !acik) gorselModu = "gorselsiz";
    if (id === "gorsel" && acik && form.gorselModu === "gorselsiz") gorselModu = "buyuk_kapak";
    onChange({ ...form, bloklar, gorselModu });
  };

  const paketSec = (mod: YatiliYogunlukModu) => {
    onChange({
      ...form,
      yogunlukModu: mod,
      bloklar: yogunlukModuUygula(mod),
      gorselModu: yogunlukGorselModu(mod),
    });
  };

  const vurguSec = (vurgu: YatiliProgramFormData["vurguOdagi"]) => {
    const bloklar = vurguOdagiUygula(vurgu, form.bloklar);
    let patch: Partial<YatiliProgramFormData> = { vurguOdagi: vurgu, bloklar };
    if (vurgu === "gorsel") patch = { ...patch, gorselModu: "buyuk_kapak", sablon: "hero_invite" };
    else if (vurgu === "gunluk_program")
      patch = { ...patch, sablon: "program_flow", bloklar: { ...bloklar, gunlukProgram: true } };
    else if (vurgu === "guven") patch = { ...patch, sablon: "trust_focused" };
    else patch.sablon = vurguSablonOnerisi(vurgu);
    onChange({ ...form, ...patch });
  };

  const gunlukGuncelle = (idx: number, alan: "saat" | "etkinlik", val: string) => {
    const gp = [...form.gunlukProgram];
    gp[idx] = { ...gp[idx], [alan]: val };
    onChange({ ...form, gunlukProgram: gp });
  };

  const inceAyarBloklari = BLOK_LISTESI.filter((b) => YATILI_INCE_AYAR_BLOKLARI.includes(b.id));

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-extrabold text-slate-800">İçerik paketi seçin</p>
        <p className="mb-3 text-xs text-slate-500">Paket, afişte hangi bölümlerin görüneceğini belirler.</p>
        <div className="grid gap-3 sm:grid-cols-1">
          {YATILI_YOGUNLUK_MODLARI.map((m) => {
            const secili = form.yogunlukModu === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => paketSec(m.id)}
                className={[
                  "rounded-2xl border-2 p-4 text-left transition active:scale-[0.99]",
                  secili
                    ? "border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-100"
                    : "border-slate-200 bg-white hover:border-indigo-300",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-extrabold text-slate-900">{m.ad}</p>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {m.kisa}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{m.icerik}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
        <p className="mb-1 text-xs font-bold text-slate-700">Bu afişte en çok ne öne çıksın?</p>
        <select
          className={inputCls}
          value={form.vurguOdagi}
          onChange={(e) => vurguSec(e.target.value as YatiliProgramFormData["vurguOdagi"])}
        >
          <option value="tarih">Tarih</option>
          <option value="guven">Güven</option>
          <option value="gunluk_program">Günlük program</option>
          <option value="gorsel">Görsel</option>
          <option value="basvuru">Başvuru / QR</option>
          <option value="slogan">Slogan</option>
        </select>
      </div>

      <button
        type="button"
        onClick={onOtomatikDoldur}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-xs font-bold text-white shadow-md transition hover:opacity-95 active:scale-[0.99]"
      >
        <Sparkles className="h-4 w-4" />
        Metinleri otomatik oluştur
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setInceAyarAcik((a) => !a)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        >
          <span className="text-xs font-bold text-slate-700">Blokları özelleştir (ince ayar)</span>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition ${inceAyarAcik ? "rotate-180" : ""}`} />
        </button>
        {inceAyarAcik ? (
          <div className="grid gap-2 border-t border-slate-100 px-3 pb-3 sm:grid-cols-2">
            {inceAyarBloklari.map((b) => {
              const acik = form.bloklar[b.id] ?? true;
              return (
                <label
                  key={b.id}
                  className={[
                    "flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 transition",
                    acik ? "border-indigo-200 bg-indigo-50/80" : "border-slate-200 bg-slate-50",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={acik}
                    onChange={(e) => blokToggle(b.id, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                  />
                  <span>
                    <span className="block text-xs font-bold text-slate-800">{b.ad}</span>
                    <span className="block text-[10px] text-slate-500">{b.kisa}</span>
                  </span>
                </label>
              );
            })}
          </div>
        ) : null}
      </div>

      {form.bloklar.gunlukProgram ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <p className="mb-2 text-xs font-bold text-slate-700">Günlük program (saatli)</p>
          <div className="space-y-2">
            {form.gunlukProgram.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={`${inputCls} w-20 shrink-0`}
                  value={s.saat}
                  onChange={(e) => gunlukGuncelle(i, "saat", e.target.value)}
                  placeholder="17:00"
                />
                <input
                  className={inputCls}
                  value={s.etkinlik}
                  onChange={(e) => gunlukGuncelle(i, "etkinlik", e.target.value)}
                  placeholder="Etkinlik"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-extrabold text-slate-800">Afişte görünecek kısa metinler</p>
        <OtomatikMetinEditoru form={form} onChange={onChange} />
      </div>
    </div>
  );
}
