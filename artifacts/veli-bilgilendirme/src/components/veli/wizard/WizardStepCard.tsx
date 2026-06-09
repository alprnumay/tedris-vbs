import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
  error?: string | null;
};

export function WizardStepCard({ title, description, children, error }: Props) {
  return (
    <section className="veli-wizard-step-card rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <header className="mb-4">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </header>
      {error ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          {error}
        </div>
      ) : null}
      <div className="space-y-4">{children}</div>
    </section>
  );
}
