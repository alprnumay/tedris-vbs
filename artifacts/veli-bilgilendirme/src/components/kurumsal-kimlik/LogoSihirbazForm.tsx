import { LOGO_KARAKTERLER, karakterToggle } from "@/lib/logo/logoKarakterler";
import { LOGO_RENK_TEMALARI } from "@/lib/logo/logoRenkTemalari";
import type { LogoGorselYon, LogoSihirbazForm } from "@/types/logoKimlik";

const GORSEL_YONLER: { id: LogoGorselYon; label: string }[] = [
  { id: "symbol", label: "Sembol" },
  { id: "monogram", label: "Monogram" },
  { id: "combined", label: "Sembol + Harf" },
  { id: "wordmark", label: "Sadece yazı" },
];

interface Props {
  form: LogoSihirbazForm;
  onChange: (f: LogoSihirbazForm) => void;
  onUret: () => void;
  uretiliyor?: boolean;
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export function LogoSihirbazForm({ form, onChange, onUret, uretiliyor }: Props) {
  const kurum = form.kurum;
  const setKurum = (patch: Partial<typeof kurum>) =>
    onChange({ ...form, kurum: { ...kurum, ...patch } });

  const formGecerli = Boolean(form.kategori && kurum.kurumAdi.trim());

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Kurum bilgileri</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Kurum adı *</span>
            <input
              className={inputCls}
              value={kurum.kurumAdi}
              onChange={(e) => setKurum({ kurumAdi: e.target.value })}
              placeholder="Örn: Özel Tedris Yurtları"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-600">Kısa ad</span>
            <input
              className={inputCls}
              value={kurum.kisaAd}
              onChange={(e) => setKurum({ kisaAd: e.target.value })}
              placeholder="Örn: TEDRİS"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-600">Kuruluş yılı</span>
            <input
              className={inputCls}
              value={kurum.kurulusYili}
              onChange={(e) => setKurum({ kurulusYili: e.target.value })}
              placeholder="Örn: 1998"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Alt yazı / slogan</span>
            <input
              className={inputCls}
              value={kurum.slogan}
              onChange={(e) => setKurum({ slogan: e.target.value })}
              placeholder="Örn: Geleceğe güvenle"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-600">Şehir</span>
            <input
              className={inputCls}
              value={kurum.sehir}
              onChange={(e) => setKurum({ sehir: e.target.value })}
              placeholder="Örn: Antalya"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-600">İlçe</span>
            <input
              className={inputCls}
              value={kurum.ilce}
              onChange={(e) => setKurum({ ilce: e.target.value })}
              placeholder="Örn: Kemer"
            />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Kurum karakteri <span className="font-normal normal-case text-slate-400">(en fazla 2)</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {LOGO_KARAKTERLER.map((k) => {
            const secili = form.karakterler.includes(k.id);
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => onChange({ ...form, karakterler: karakterToggle(form.karakterler, k.id) })}
                className={[
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  secili
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200",
                ].join(" ")}
              >
                {k.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Görsel yön</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GORSEL_YONLER.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onChange({ ...form, gorselYon: g.id })}
              className={[
                "rounded-xl border-2 px-2 py-2.5 text-xs font-bold transition",
                form.gorselYon === g.id
                  ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                  : "border-slate-200 bg-white text-slate-600",
              ].join(" ")}
            >
              {g.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Renk yönü</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LOGO_RENK_TEMALARI.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ ...form, renkTema: t.id })}
              className={[
                "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-xs font-semibold transition",
                form.renkTema === t.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <span
                className="h-5 w-5 shrink-0 rounded-full border border-slate-200"
                style={{ background: `linear-gradient(135deg, ${t.palette.primary}, ${t.palette.secondary})` }}
              />
              <span className="text-slate-800">{t.ad}</span>
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        disabled={!formGecerli || uretiliyor}
        onClick={onUret}
        className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uretiliyor ? "Öneriler hazırlanıyor…" : "Logo önerilerini oluştur"}
      </button>
    </div>
  );
}
