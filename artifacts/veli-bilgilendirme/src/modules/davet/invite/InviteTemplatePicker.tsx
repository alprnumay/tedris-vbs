import { cn } from "@/lib/utils";
import type { InviteTemplateDef } from "@/modules/davet/invite/inviteTemplates";
import { Check } from "lucide-react";

type Props = {
  templates: InviteTemplateDef[];
  value: string;
  onChange: (id: string) => void;
};

export function InviteTemplatePicker({ templates, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {templates.map((tpl) => {
        const selected = value === tpl.id;
        return (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onChange(tpl.id)}
            className={cn(
              "group w-full rounded-xl border-2 p-3.5 text-left transition-all",
              selected
                ? "border-blue-600 bg-blue-50/90 shadow-sm ring-2 ring-blue-200/80"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80",
            )}
          >
            <div
              className="mb-3 h-2.5 w-full rounded-full"
              style={{ background: tpl.previewGradient }}
              aria-hidden
            />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className={cn("text-sm font-semibold", selected ? "text-blue-900" : "text-slate-900")}>
                  {tpl.label}
                </div>
                <div className="mt-1 text-xs leading-relaxed text-slate-500">{tpl.description}</div>
              </div>
              {selected ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
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
