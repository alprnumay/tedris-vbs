import { cn } from "@/lib/utils";
import { VELI_WIZARD_STEPS, VELI_WIZARD_STEP_COUNT, wizardProgress } from "@/lib/veli/veliWizardSteps";

type Props = {
  activeStep: number;
  onStepClick?: (step: number) => void;
  compact?: boolean;
};

export function WizardStepper({ activeStep, onStepClick, compact }: Props) {
  const current = VELI_WIZARD_STEPS[activeStep];
  const pct = wizardProgress(activeStep);

  return (
    <div className="veli-wizard-stepper space-y-2.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-bold text-slate-700">
          Adım {activeStep + 1} / {VELI_WIZARD_STEP_COUNT}
          {!compact && current ? ` · ${current.title}` : ""}
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
          {VELI_WIZARD_STEPS.map((s, idx) => {
            const done = idx < activeStep;
            const active = idx === activeStep;
            const clickable = Boolean(onStepClick);
            return (
              <button
                key={s.id}
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(idx)}
                className={cn(
                  "rounded-lg px-1 py-1.5 text-[10px] font-bold leading-tight transition-colors",
                  active && "bg-blue-600 text-white shadow-sm",
                  done && !active && "bg-blue-50 text-blue-700",
                  !active && !done && "bg-slate-100 text-slate-400",
                  clickable && !active && "hover:bg-blue-100",
                )}
              >
                {s.title.split(" ")[0]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
