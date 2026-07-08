import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { normalizeYatiliProgramForm } from "@/lib/yatili-program/yatiliMetinUretici";
import { otomatikMetinDoldur } from "@/lib/yatili-program/yatiliMetinUretici";
import {
  YATILI_PROGRAM_TURLERI,
  type YatiliFormAdimi,
  type YatiliProgramFormData,
  type YatiliProgramTonu,
} from "@/types/yatiliProgram";
import { YatiliBlokPaneli } from "./YatiliBlokPaneli";
import { YatiliSablonSecici } from "./YatiliSablonSecici";
import {
  POSTER_IMAGE_FIELD_HINT,
  processPosterImageFiles,
} from "@/lib/images/validatePosterImage";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

const TON_SECENEKLERI: { id: YatiliProgramTonu; ad: string }[] = [
  { id: "sicak", ad: "Sıcak" },
  { id: "kurumsal", ad: "Kurumsal" },
  { id: "ikna_edici", ad: "İkna edici" },
  { id: "enerjik", ad: "Enerjik" },
];

const ADIM: Record<YatiliFormAdimi, string> = {
  1: "Program türü",
  2: "Temel bilgiler",
  3: "İçerik paketi",
  4: "Tasarım seçimi",
  5: "Önizleme ve indir",
};

function hizliOrnekDoldur(form: YatiliProgramFormData): YatiliProgramFormData {
  return normalizeYatiliProgramForm({
    ...form,
    kurumAdi: "Kemer Öğrenci Yurdu",
    programTarihi: "15 Haziran Cumartesi",
    sinifYasGrubu: "4-5-6. Sınıflar",
    kontenjan: "Sınırlı kontenjan",
    iletisim: "Bilgi ve kayıt için yurt mesulüyle iletişime geçiniz.",
  });
}

export function YatiliProgramFormu({
  form,
  onChange,
  adim,
  setAdim,
  onOtomatikDoldur,
  onAdim5,
}: {
  form: YatiliProgramFormData;
  onChange: (next: YatiliProgramFormData) => void;
  adim: YatiliFormAdimi;
  setAdim: (a: YatiliFormAdimi) => void;
  onOtomatikDoldur: () => void;
  onAdim5?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [gorselHata, setGorselHata] = useState<string | null>(null);
  const [gorselUyari, setGorselUyari] = useState<string | null>(null);

  const turSec = (id: YatiliProgramFormData["programTuru"]) => {
    const metin = otomatikMetinDoldur({ ...form, programTuru: id });
    onChange(
      normalizeYatiliProgramForm({
        ...form,
        programTuru: id,
        ...metin,
        bloklar: form.bloklar,
      }),
    );
  };

  const ileri = () => {
    if (adim < 5) {
      const next = (adim + 1) as YatiliFormAdimi;
      setAdim(next);
      if (next === 5) onAdim5?.();
    }
  };

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-4 shrink-0">
        <div className="flex gap-1">
          {([1, 2, 3, 4, 5] as YatiliFormAdimi[]).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAdim(n)}
              className={["h-2 flex-1 rounded-full transition", n <= adim ? "bg-indigo-500" : "bg-slate-200"].join(" ")}
              aria-label={ADIM[n]}
            />
          ))}
        </div>
        <p className="mt-2 text-sm font-extrabold text-slate-800">
          Adım {adim}/5 · {ADIM[adim]}
        </p>
        <p className="text-xs text-slate-500">Seçimleriniz sağdaki afişe anında yansır.</p>
      </div>

      <div className="min-h-0 flex-1 pb-4">
        {adim === 1 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <p className="col-span-full text-xs text-slate-500">
              Program türünü seçin; başlık ve metinler buna göre hazırlanır.
            </p>
            {YATILI_PROGRAM_TURLERI.map((t) => {
              const secili = form.programTuru === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => turSec(t.id)}
                  className={[
                    "rounded-2xl border-2 p-4 text-left transition active:scale-[0.99]",
                    secili
                      ? "border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-100"
                      : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm",
                  ].join(" ")}
                >
                  <span className="text-2xl" aria-hidden>
                    {t.ikon}
                  </span>
                  <p className="mt-2 text-sm font-extrabold text-slate-900">{t.ad}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{t.kisa}</p>
                  <p className="mt-2 rounded-lg bg-slate-100/80 px-2 py-1 text-[10px] font-medium text-slate-600">
                    {t.ipucu}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {adim === 2 && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => onChange(hizliOrnekDoldur(form))}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-xs font-bold text-amber-900 transition hover:bg-amber-100"
            >
              <Zap className="h-4 w-4" />
              Hızlı örnek doldur
            </button>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Zorunlu</p>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Kurum / yurt adı</span>
                <input
                  className={inputCls}
                  value={form.kurumAdi}
                  onChange={(e) => onChange({ ...form, kurumAdi: e.target.value })}
                  placeholder="Örn. Kemer Öğrenci Yurdu"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Tarih</span>
                <input
                  className={inputCls}
                  value={form.programTarihi}
                  onChange={(e) => onChange({ ...form, programTarihi: e.target.value })}
                  placeholder="15 Haziran Cumartesi"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">İletişim</span>
                <input
                  className={inputCls}
                  value={form.iletisim}
                  onChange={(e) => onChange({ ...form, iletisim: e.target.value })}
                  placeholder="Kayıt için iletişim bilgisi"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-200 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Opsiyonel</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Sınıf / yaş</span>
                  <input
                    className={inputCls}
                    value={form.sinifYasGrubu}
                    onChange={(e) => onChange({ ...form, sinifYasGrubu: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Kontenjan</span>
                  <input
                    className={inputCls}
                    value={form.kontenjan}
                    onChange={(e) => onChange({ ...form, kontenjan: e.target.value })}
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">QR linki</span>
                <input
                  className={inputCls}
                  value={form.qrLink}
                  onChange={(e) => onChange({ ...form, qrLink: e.target.value })}
                  placeholder="https://..."
                />
              </label>
            </div>

            <div>
              <span className="mb-2 block text-xs font-semibold text-slate-600">Metin tonu</span>
              <div className="flex flex-wrap gap-2">
                {TON_SECENEKLERI.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onChange({ ...form, programTonu: t.id })}
                    className={[
                      "rounded-full px-3 py-1.5 text-xs font-bold transition",
                      form.programTonu === t.id ? "bg-indigo-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                    ].join(" ")}
                  >
                    {t.ad}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {adim === 3 && <YatiliBlokPaneli form={form} onChange={onChange} onOtomatikDoldur={onOtomatikDoldur} />}

        {adim === 4 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <span className="mb-2 block text-xs font-bold text-slate-600">Görseller (1–3, isteğe bağlı)</span>
              <p className="mb-2 text-[11px] leading-relaxed text-slate-500">{POSTER_IMAGE_FIELD_HINT}</p>
              {gorselHata ? (
                <p className="mb-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] font-semibold text-red-700">{gorselHata}</p>
              ) : null}
              {gorselUyari ? (
                <p className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] font-semibold text-amber-800">{gorselUyari}</p>
              ) : null}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files?.length) return;
                  const kalan = 3 - form.gorseller.length;
                  if (kalan <= 0) return;
                  const { dataUrls, errorMessage, warningMessage } = await processPosterImageFiles(
                    Array.from(files),
                    kalan,
                  );
                  if (errorMessage) {
                    setGorselHata(errorMessage);
                    toast.error(errorMessage, { id: "poster-image-portrait" });
                  } else {
                    setGorselHata(null);
                  }
                  if (warningMessage) {
                    setGorselUyari(warningMessage);
                    toast.warning(warningMessage, { id: "poster-image-wide" });
                  } else if (!errorMessage) {
                    setGorselUyari(null);
                  }
                  if (dataUrls.length > 0) {
                    onChange({ ...form, gorseller: [...form.gorseller, ...dataUrls] });
                  }
                  e.target.value = "";
                }}
              />
              {form.gorseller.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-indigo-200 bg-white py-3 text-xs font-bold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-50/50"
                >
                  + Görsel yükle ({form.gorseller.length}/3)
                </button>
              )}
              {form.gorseller.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.gorseller.map((g, i) => (
                    <div key={i} className="relative h-16 w-16 overflow-hidden rounded-xl border-2 border-white shadow-md">
                      <img src={g} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow"
                        onClick={() => onChange({ ...form, gorseller: form.gorseller.filter((_, j) => j !== i) })}
                        aria-label="Görseli kaldır"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <YatiliSablonSecici form={form} onChange={onChange} />
          </div>
        )}

        {adim === 5 && (
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4">
            <p className="text-sm font-semibold text-slate-800">Afişiniz hazır</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Sağdaki önizlemeden kontrol edin. <strong>Sığdır</strong> ile tamamını görün; PNG, PDF veya WhatsApp ile paylaşın.
            </p>
            <button
              type="button"
              onClick={() => onAdim5?.()}
              className="mt-3 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white lg:hidden"
            >
              Önizlemeyi aç
            </button>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-20 flex shrink-0 gap-2 border-t border-slate-100 bg-white/95 py-3 backdrop-blur-sm">
        {adim > 1 ? (
          <button
            type="button"
            onClick={() => setAdim((adim - 1) as YatiliFormAdimi)}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Geri
          </button>
        ) : (
          <div className="flex-1" />
        )}
        {adim < 5 ? (
          <button
            type="button"
            onClick={ileri}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 active:scale-[0.99]"
          >
            İleri
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onOtomatikDoldur}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-xs font-bold text-indigo-800"
          >
            <Sparkles className="h-4 w-4" />
            Metinleri yenile
          </button>
        )}
      </div>
    </div>
  );
}
