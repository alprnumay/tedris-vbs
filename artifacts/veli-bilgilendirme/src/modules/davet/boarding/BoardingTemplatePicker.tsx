import { cn } from "@/lib/utils";
import type { BoardingTemplateDef } from "@/modules/davet/boarding/boardingTemplates";
import { Check } from "lucide-react";

export function BoardingTemplatePicker({
  templates,
  value,
  onChange,
}: {
  templates: BoardingTemplateDef[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {templates.map((tpl) => {
        const selected = value === tpl.id;
        return (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onChange(tpl.id)}
            className={cn(
              "w-full rounded-xl border-2 p-3 text-left transition-all",
              selected ? "border-indigo-600 bg-indigo-50/90 ring-2 ring-indigo-200/80" : "border-slate-200 bg-white hover:border-slate-300",
            )}
          >
            <div className="mb-2 h-14 w-full overflow-hidden rounded-lg border" style={{ background: tpl.previewGradient }} />
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-900">{tpl.label}</div>
                <div className="mt-0.5 text-[11px] font-medium text-indigo-700">{tpl.tag}</div>
                <div className="mt-1 text-xs leading-relaxed text-slate-500">{tpl.description}</div>
              </div>
              {selected ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
