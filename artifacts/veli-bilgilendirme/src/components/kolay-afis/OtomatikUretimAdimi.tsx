import { Sparkles } from "lucide-react";
import type { KolayAfisForm } from "@/types/kolayAfis";

export function OtomatikUretimAdimi({
  onUret,
  uretildi,
}: {
  form: KolayAfisForm;
  onUret: () => void;
  uretildi: boolean;
}) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
        <Sparkles className="h-7 w-7" />
      </div>
      <h3 className="text-base font-extrabold text-slate-900">Sistem afişinizi hazırlasın</h3>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-600">
        Seçimlerinize göre metinler, yerleşim ve <strong>3 farklı afiş alternatifi</strong> otomatik oluşturulacak.
      </p>
      <button
        type="button"
        onClick={onUret}
        className="mt-5 w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 active:scale-[0.99]"
      >
        {uretildi ? "Afişleri yeniden oluştur" : "Afişleri oluştur"}
      </button>
      {uretildi ? (
        <p className="mt-3 text-[11px] text-indigo-700">Aşağıdan bir alternatif seçin veya sağdaki önizlemeyi kontrol edin.</p>
      ) : null}
    </div>
  );
}
