import { DavetLayout } from "@/modules/davet/layout/DavetLayout";
import { ModuleCard } from "@/modules/davet/layout/ModuleCard";
import { ModuleGrid } from "@/modules/davet/layout/ModuleGrid";
import { PageHeader } from "@/modules/davet/layout/PageHeader";
import { davetHomeModules } from "@/modules/davet/layout/moduleAccents";

export default function HomePage() {
  const visibleModules = davetHomeModules.filter((mod) => !mod.hidden);

  return (
    <DavetLayout>
      <div className="space-y-5 pb-8">
        <PageHeader
          variant="home"
          eyebrow="TEDRIS VBS"
          title="Nehari Platformu"
          description="Davet, program ve çalışma paylaşım araçlarına hızlı erişin."
        />

        <ModuleGrid>
          {visibleModules.map((mod) => (
            <ModuleCard
              key={mod.href}
              title={mod.title}
              shortDescription={mod.shortDescription}
              icon={mod.icon}
              accent={mod.accent}
              href={mod.href}
            />
          ))}
        </ModuleGrid>
      </div>
    </DavetLayout>
  );
}
