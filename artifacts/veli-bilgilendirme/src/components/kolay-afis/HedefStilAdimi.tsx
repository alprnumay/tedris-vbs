import {
  AFIS_TARZLARI,
  HEDEF_KITLELER,
  VURGU_SECENEKLERI,
  YOGUNLUK_SECENEKLERI,
  type KolayAfisForm,
} from "@/types/kolayAfis";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

function SecimGrubu<T extends string>({
  baslik,
  secenekler,
  secili,
  onSec,
}: {
  baslik: string;
  secenekler: { id: T; ad: string; kisa?: string }[];
  secili: T;
  onSec: (id: T) => void;
}) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{baslik}</p>
      <div className="flex flex-wrap gap-2">
        {secenekler.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSec(s.id)}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-bold transition",
              secili === s.id ? "bg-indigo-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            ].join(" ")}
            title={s.kisa}
          >
            {s.ad}
          </button>
        ))}
      </div>
    </div>
  );
}

export function HedefStilAdimi({ form, onChange }: { form: KolayAfisForm; onChange: (f: KolayAfisForm) => void }) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-600">Afişin karakterini belirleyin; sistem metin ve düzeni buna göre ayarlar.</p>
      <SecimGrubu baslik="Hedef kitle" secenekler={HEDEF_KITLELER} secili={form.hedefKitle} onSec={(id) => onChange({ ...form, hedefKitle: id })} />
      <SecimGrubu baslik="Afiş tarzı" secenekler={AFIS_TARZLARI} secili={form.tarz} onSec={(id) => onChange({ ...form, tarz: id })} />
      <SecimGrubu
        baslik="Bilgi yoğunluğu"
        secenekler={YOGUNLUK_SECENEKLERI}
        secili={form.yogunluk}
        onSec={(id) => onChange({ ...form, yogunluk: id })}
      />
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">En çok ne öne çıksın?</p>
        <select className={inputCls} value={form.vurgu} onChange={(e) => onChange({ ...form, vurgu: e.target.value as KolayAfisForm["vurgu"] })}>
          {VURGU_SECENEKLERI.map((v) => (
            <option key={v.id} value={v.id}>
              {v.ad}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
