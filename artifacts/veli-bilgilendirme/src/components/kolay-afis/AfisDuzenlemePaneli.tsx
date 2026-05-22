import { ChevronDown } from "lucide-react";
import { AFIS_TEMALAR } from "@/lib/kolay-afis/afisTemaSistemi";
import type { AfisAlternatif, AfisTemaId, BilgiYogunlugu, KolayAfisForm } from "@/types/kolayAfis";
import { YOGUNLUK_SECENEKLERI } from "@/types/kolayAfis";

const inputCls =
  "w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-indigo-400";

export function AfisDuzenlemePaneli({
  acik,
  onAcikDegistir,
  form,
  onChange,
  alternatif,
  qrGoster,
  ikonluMaddeler,
  onQrToggle,
  onIkonToggle,
  onTemaDegistir,
  onYogunlukDegistir,
}: {
  acik: boolean;
  onAcikDegistir: (v: boolean) => void;
  form: KolayAfisForm;
  onChange: (f: KolayAfisForm) => void;
  alternatif: AfisAlternatif | null;
  qrGoster: boolean;
  ikonluMaddeler: boolean;
  onQrToggle: (v: boolean) => void;
  onIkonToggle: (v: boolean) => void;
  onTemaDegistir: (tema: AfisTemaId) => void;
  onYogunlukDegistir: (y: BilgiYogunlugu) => void;
}) {
  if (!alternatif) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button type="button" onClick={() => onAcikDegistir(!acik)} className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-bold text-slate-700">
        Metinleri düzenle
        <ChevronDown className={`h-4 w-4 transition ${acik ? "rotate-180" : ""}`} />
      </button>
      {acik ? (
        <div className="space-y-2 border-t border-slate-100 px-3 pb-3 pt-2">
          <label className="block">
            <span className="text-[10px] font-semibold text-slate-500">Başlık</span>
            <input className={inputCls} value={form.baslik} onChange={(e) => onChange({ ...form, baslik: e.target.value })} placeholder={alternatif.brief.metin.title} />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold text-slate-500">Sınıf / alt başlık</span>
            <input className={inputCls} value={form.sinifYas} onChange={(e) => onChange({ ...form, sinifYas: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold text-slate-500">Kısa açıklama</span>
            <textarea className={inputCls} rows={2} value={form.kisaAciklama} onChange={(e) => onChange({ ...form, kisaAciklama: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold text-slate-500">Tarih</span>
            <input className={inputCls} value={form.tarih} onChange={(e) => onChange({ ...form, tarih: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold text-slate-500">Telefon</span>
            <input className={inputCls} value={form.telefon} onChange={(e) => onChange({ ...form, telefon: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold text-slate-500">QR link</span>
            <input className={inputCls} value={form.qrLink} onChange={(e) => onChange({ ...form, qrLink: e.target.value })} />
          </label>
          <div className="flex flex-wrap gap-3 pt-1">
            <label className="flex items-center gap-1.5 text-[10px] font-semibold">
              <input type="checkbox" checked={qrGoster} onChange={(e) => onQrToggle(e.target.checked)} />
              QR göster
            </label>
            <label className="flex items-center gap-1.5 text-[10px] font-semibold">
              <input type="checkbox" checked={ikonluMaddeler} onChange={(e) => onIkonToggle(e.target.checked)} />
              İkonlu maddeler
            </label>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500">Tema</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {(Object.keys(AFIS_TEMALAR) as AfisTemaId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onTemaDegistir(id)}
                  className={[
                    "rounded-full px-2 py-0.5 text-[9px] font-bold",
                    alternatif.brief.tema === id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600",
                  ].join(" ")}
                >
                  {AFIS_TEMALAR[id].ad}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500">Yoğunluk</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {YOGUNLUK_SECENEKLERI.map((y) => (
                <button
                  key={y.id}
                  type="button"
                  onClick={() => onYogunlukDegistir(y.id)}
                  className={[
                    "rounded-full px-2 py-0.5 text-[9px] font-bold",
                    form.yogunluk === y.id ? "bg-indigo-600 text-white" : "bg-slate-100",
                  ].join(" ")}
                >
                  {y.ad}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
