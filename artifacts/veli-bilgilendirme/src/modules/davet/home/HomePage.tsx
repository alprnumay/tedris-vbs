import { DavetLayout } from "@/modules/davet/layout/DavetLayout";
import { ModuleCard } from "@/modules/davet/layout/ModuleCard";
import { ModuleGrid } from "@/modules/davet/layout/ModuleGrid";
import { ModulePageHeader } from "@/modules/davet/layout/ModulePageHeader";
import { NehariHomeHero } from "@/modules/davet/layout/NehariHomeHero";
import { davetHomeModules } from "@/modules/davet/layout/moduleAccents";

export default function HomePage() {
  const visibleModules = davetHomeModules.filter((mod) => !mod.hidden);

  return (
    <DavetLayout variant="home">
      <div className="space-y-6 pb-10 sm:space-y-8">
        <ModulePageHeader variant="platform-home" />
        <NehariHomeHero />

        <div className="space-y-4">
          <div className="flex items-end justify-between gap-3 px-0.5">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Modüller</h2>
              <p className="mt-1 text-sm text-slate-600">İhtiyacınıza uygun aracı seçerek başlayın.</p>
            </div>
            <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 sm:inline">
              {visibleModules.length} araç
            </span>
          </div>

          <ModuleGrid variant="home">
            {visibleModules.map((mod) => (
              <ModuleCard
                key={mod.href}
                variant="featured"
                title={mod.title}
                description={mod.description}
                ctaLabel={mod.ctaLabel}
                icon={mod.icon}
                accent={mod.accent}
                href={mod.href}
              />
            ))}
          </ModuleGrid>
        </div>
      </div>
    </DavetLayout>
  );
}
