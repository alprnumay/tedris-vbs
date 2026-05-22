import { useState } from "react";
import type { FormData, SablonTuru } from "@/types";
import { veliKaliteKontrol } from "@/lib/veli/veliKaliteKontrol";
import { veliSistemOnerileri } from "@/lib/veli/veliKaliteKontrol";
import { veliWhatsappMesajiOlustur } from "@/lib/veli/veliWhatsappMesaji";
import { onerilenSablon } from "@/lib/veli/veliSablonOnerici";

const DURUM_STIL: Record<string, { bg: string; border: string; color: string; label: string }> = {
  hazir: { bg: "#ecfdf5", border: "#a7f3d0", color: "#047857", label: "Hazır" },
  dikkat: { bg: "#fffbeb", border: "#fde68a", color: "#b45309", label: "Dikkat" },
  eksik: { bg: "#fef2f2", border: "#fecaca", color: "#b91c1c", label: "Eksik bilgi var" },
};

export function VeliYanPanel({
  form,
  seciliSablon,
  onSablonOner,
}: {
  form: FormData;
  seciliSablon: SablonTuru;
  onSablonOner?: (id: SablonTuru) => void;
}) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const kalite = veliKaliteKontrol(form, seciliSablon);
  const oneriler = veliSistemOnerileri(form, seciliSablon);
  const sablonOner = onerilenSablon(form, seciliSablon);
  const waMetin = veliWhatsappMesajiOlustur(form);
  const st = DURUM_STIL[kalite.durum];

  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(waMetin);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="rounded-xl border p-3" style={{ background: st.bg, borderColor: st.border }}>
        <p className="text-xs font-extrabold" style={{ color: st.color }}>
          Afiş kalitesi: {st.label}
        </p>
        <ul className="mt-2 space-y-1">
          {kalite.maddeler.map((m, i) => (
            <li key={i} className="text-[11px] font-medium text-slate-700">
              {m.ok ? "✓" : "!"} {m.metin}
            </li>
          ))}
        </ul>
      </div>

      {oneriler.length > 0 && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 p-3">
          <p className="text-xs font-extrabold text-indigo-900">Sistem önerisi</p>
          <ul className="mt-1.5 space-y-1">
            {oneriler.map((o, i) => (
              <li key={i} className="text-[11px] leading-snug text-indigo-800">
                • {o}
              </li>
            ))}
          </ul>
        </div>
      )}

      {sablonOner && onSablonOner ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-slate-700">
          <span className="font-bold">Önerilen şablon:</span> {sablonOner.ad}
          <br />
          <span className="text-slate-500">{sablonOner.neden}</span>
          <button
            type="button"
            onClick={() => onSablonOner(sablonOner.id)}
            className="mt-2 block text-xs font-bold text-indigo-700 underline"
          >
            Bu şablonu seç
          </button>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-extrabold text-slate-800">WhatsApp mesaj önerisi</p>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-600">{waMetin}</p>
        <button
          type="button"
          onClick={kopyala}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700"
        >
          {kopyalandi ? "Kopyalandı ✓" : "Metni kopyala"}
        </button>
        <p className="mt-1.5 text-[10px] text-slate-400">WA butonu afişi paylaşır; bu metin veliye yazı olarak gidebilir.</p>
      </div>
    </div>
  );
}
