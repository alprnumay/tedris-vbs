import type { FormData, SablonTuru } from "@/types";
import { veliKaliteKontrol } from "@/lib/veli/veliKaliteKontrol";
import { wizardStepQualityLines } from "@/lib/veli/veliWizardSteps";

const DURUM_STIL: Record<string, { bg: string; border: string; color: string; label: string }> = {
  hazir: { bg: "#ecfdf5", border: "#a7f3d0", color: "#047857", label: "Hazır" },
  dikkat: { bg: "#fffbeb", border: "#fde68a", color: "#b45309", label: "Dikkat" },
  eksik: { bg: "#fef2f2", border: "#fecaca", color: "#b91c1c", label: "Eksik bilgi var" },
};

export function QualityPanel({ form, seciliSablon, full = false }: { form: FormData; seciliSablon: SablonTuru; full?: boolean }) {
  const kalite = veliKaliteKontrol(form, seciliSablon);
  const st = DURUM_STIL[kalite.durum];
  const lines = wizardStepQualityLines(form, seciliSablon);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border p-4" style={{ background: st.bg, borderColor: st.border }}>
        <p className="text-sm font-extrabold" style={{ color: st.color }}>
          Afiş Kalitesi: {st.label}
        </p>
        <ul className="mt-2 space-y-1.5">
          {(full ? lines : lines.slice(0, 3)).map((line) => (
            <li key={line.label} className="flex items-start gap-2 text-xs font-medium text-slate-700">
              <span className={line.ok ? "text-emerald-600" : line.optional ? "text-slate-400" : "text-amber-600"}>
                {line.ok ? "✓" : line.optional ? "○" : "!"}
              </span>
              {line.label}
            </li>
          ))}
        </ul>
      </div>
      {full && kalite.uyarilar.length > 0 && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-3">
          <p className="text-xs font-extrabold text-amber-900">Öneriler</p>
          <ul className="mt-1.5 space-y-1">
            {kalite.uyarilar.slice(0, 4).map((u) => (
              <li key={u} className="text-[11px] leading-snug text-amber-900">
                • {u}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
