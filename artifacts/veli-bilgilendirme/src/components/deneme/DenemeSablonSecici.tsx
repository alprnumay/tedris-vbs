import type { DenemeSablonu } from "@/types/denemeSinavi";
import { SABLON_GALERI_KARTLARI } from "./DenemeSablonGalerisi";
import { cn } from "@/lib/utils";

export function DenemeSablonSecici({
  value,
  onChange,
}: {
  value: DenemeSablonu;
  onChange: (s: DenemeSablonu) => void;
}) {
  return (
    <div className="max-h-[min(22rem,50vh)] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2 pr-1">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SABLON_GALERI_KARTLARI.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={cn(
              "rounded-xl border px-3 py-2 text-left text-xs font-semibold transition",
              value === s.id
                ? "border-indigo-500 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-200"
                : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200",
            )}
          >
            <span className="block font-bold leading-tight">{s.ad}</span>
            <span className="mt-0.5 block text-[10px] font-normal leading-snug text-slate-500">{s.kisa}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
