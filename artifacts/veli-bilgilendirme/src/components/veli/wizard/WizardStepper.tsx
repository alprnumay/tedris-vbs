import { cn } from "@/lib/utils";
import { VELI_WIZARD_STEPS, wizardProgress, type VeliWizardStep } from "@/lib/veli/veliWizardSteps";

type Props = {
  step: VeliWizardStep;
  onStepClick?: (step: VeliWizardStep) => void;
  compact?: boolean;
};

export function WizardStepper({ step, onStepClick, compact }: Props) {
  const current = VELI_WIZARD_STEPS.find((s) => s.id === step);
  const pct = wizardProgress(step);

  return (
    <div className="veli-wizard-stepper space-y-2.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-bold text-slate-700">
          Adım {step} / 5
          {!compact && current ? ` · ${current.subtitle}` : ""}
        </span>
        <span className="font-semibold text-blue-600">%{pct} tamamlandı</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {!compact && (
        <div className="grid grid-cols-5 gap-1">
          {VELI_WIZARD_STEPS.map((s) => {
            const done = s.id < step;
            const active = s.id === step;
            const clickable = onStepClick && s.id <= step;
            return (
              <button
                key={s.id}
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick(s.id)}
                className={cn(
                  "rounded-lg px-1 py-1.5 text-[10px] font-bold leading-tight transition-colors",
                  active && "bg-blue-600 text-white shadow-sm",
                  done && !active && "bg-blue-50 text-blue-700",
                  !active && !done && "bg-slate-100 text-slate-400",
                  clickable && !active && "hover:bg-blue-100",
                )}
              >
                {s.title}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
