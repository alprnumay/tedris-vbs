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
    <div className="veli-wizard-stepper">
      <div className="veli-wizard-stepper__meta">
        <span className="veli-wizard-stepper__title">
          Adım {activeStep + 1}/{VELI_WIZARD_STEP_COUNT}
          {!compact && current ? ` · ${current.title}` : ""}
        </span>
        <span className="veli-wizard-stepper__pct">%{pct}</span>
      </div>
      <div className="veli-wizard-stepper__track">
        <div className="veli-wizard-stepper__fill" style={{ width: `${pct}%` }} />
      </div>
      {!compact && (
        <div className="veli-wizard-stepper__steps">
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
                className={[
                  "veli-wizard-stepper__step",
                  active && "is-active",
                  done && !active && "is-done",
                  !active && !done && "is-idle",
                ].filter(Boolean).join(" ")}
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
