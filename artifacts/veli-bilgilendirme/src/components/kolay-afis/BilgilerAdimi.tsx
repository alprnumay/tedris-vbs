import { Zap } from "lucide-react";
import { hizliOrnekForm } from "@/lib/kolay-afis/afisMetinUretici";
import { LIMIT } from "@/lib/kolay-afis/afisAlanKurallari";
import type { KolayAfisForm } from "@/types/kolayAfis";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export function BilgilerAdimi({ form, onChange }: { form: KolayAfisForm; onChange: (f: KolayAfisForm) => void }) {
  const maddeGuncelle = (i: number, val: string) => {
    const next = [...form.programMaddeleri];
    next[i] = val;
    onChange({ ...form, programMaddeleri: next });
  };

  const maddeEkle = () => {
    if (form.programMaddeleri.length >= LIMIT.featureMax) return;
    onChange({ ...form, programMaddeleri: [...form.programMaddeleri, ""] });
  };

  const maddeSil = (i: number) => {
    onChange({ ...form, programMaddeleri: form.programMaddeleri.filter((_, j) => j !== i) });
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => onChange({ ...form, ...hizliOrnekForm() })}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-xs font-bold text-amber-900"
      >
        <Zap className="h-4 w-4" />
        Hızlı örnek doldur
      </button>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
        <p className="text-xs font-bold text-slate-500">Temel bilgiler</p>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Kurum / yurt adı</span>
          <input className={inputCls} value={form.kurumAdi} onChange={(e) => onChange({ ...form, kurumAdi: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Afiş ana başlığı</span>
          <input className={inputCls} value={form.baslik} onChange={(e) => onChange({ ...form, baslik: e.target.value })} placeholder="Boş bırakılırsa otomatik" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Tarih</span>
          <input className={inputCls} value={form.tarih} onChange={(e) => onChange({ ...form, tarih: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Telefon / iletişim</span>
          <input className={inputCls} value={form.telefon} onChange={(e) => onChange({ ...form, telefon: e.target.value })} />
        </label>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 p-4 space-y-3">
        <p className="text-xs font-bold text-slate-400">Opsiyonel</p>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-600">QR linki</span>
          <input className={inputCls} value={form.qrLink} onChange={(e) => onChange({ ...form, qrLink: e.target.value })} placeholder="https://..." />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-600">Sınıf / yaş</span>
          <input className={inputCls} value={form.sinifYas} onChange={(e) => onChange({ ...form, sinifYas: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-slate-600">Kısa açıklama</span>
          <textarea className={inputCls} rows={2} value={form.kisaAciklama} onChange={(e) => onChange({ ...form, kisaAciklama: e.target.value })} />
        </label>
        <div>
          <div className="mb-2 flex justify-between">
            <span className="text-[11px] font-semibold text-slate-600">Program maddeleri</span>
            {form.programMaddeleri.length < LIMIT.featureMax ? (
              <button type="button" onClick={maddeEkle} className="text-[11px] font-bold text-indigo-600">
                + Ekle
              </button>
            ) : null}
          </div>
          <div className="space-y-2">
            {form.programMaddeleri.map((m, i) => (
              <div key={i} className="flex gap-2">
                <input className={`${inputCls} flex-1`} value={m} onChange={(e) => maddeGuncelle(i, e.target.value)} />
                <button type="button" onClick={() => maddeSil(i)} className="shrink-0 rounded-lg border px-2 text-xs text-slate-500 hover:text-red-600">
                  ✕
                </button>
              </div>
            ))}
            {form.programMaddeleri.length === 0 ? (
              <button type="button" onClick={maddeEkle} className="w-full rounded-xl border border-dashed py-2 text-xs text-slate-500">
                Madde ekle (boşsa otomatik doldurulur)
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
