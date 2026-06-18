import type { FormData } from "@/types";
import { veliWhatsappKaliteKontrol } from "@/lib/veli/veliWhatsappPosterEngine";

const DURUM_STIL: Record<string, { bg: string; border: string; color: string; label: string }> = {
  hazir: { bg: "#ecfdf5", border: "#a7f3d0", color: "#047857", label: "WhatsApp için uygun" },
  dikkat: { bg: "#fffbeb", border: "#fde68a", color: "#b45309", label: "Kısaltma önerilir" },
};

export function WhatsAppQualityPanel({ form }: { form: FormData }) {
  const kalite = veliWhatsappKaliteKontrol(form);
  const st = DURUM_STIL[kalite.durum];

  return (
    <div className="rounded-2xl border p-3" style={{ background: st.bg, borderColor: st.border }}>
      <p className="text-xs font-extrabold" style={{ color: st.color }}>
        WhatsApp Görseli: {st.label}
      </p>
      <ul className="mt-2 space-y-1">
        {kalite.maddeler.map((m) => (
          <li key={m.metin} className="text-[11px] font-medium text-slate-700">
            {m.ok ? "✓" : "○"} {m.metin}
          </li>
        ))}
      </ul>
      {kalite.uyarilar.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-amber-100 pt-2">
          {kalite.uyarilar.slice(0, 3).map((u) => (
            <li key={u} className="text-[10px] leading-snug text-amber-900">
              • {u}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
