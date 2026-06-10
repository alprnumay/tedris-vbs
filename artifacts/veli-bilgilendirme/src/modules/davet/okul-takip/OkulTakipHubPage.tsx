import { useMemo } from "react";
import {
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  Users,
} from "lucide-react";
import { DavetLayout } from "@/modules/davet/layout/DavetLayout";
import { BackButton } from "@/modules/davet/layout/ModulePageHeader";
import { ActionCard } from "@/modules/davet/okul-takip/components/ActionCard";
import { StatCard } from "@/modules/davet/okul-takip/components/StatCard";
import {
  computeDailySummary,
  detectRiskStudent,
  getLast7Dates,
} from "@/modules/davet/okul-takip/calculations";
import {
  NEHARI_PLATFORM_HOME,
  OKUL_TAKIP_GUNLUK,
  OKUL_TAKIP_HOME,
  OKUL_TAKIP_KARNELER,
  OKUL_TAKIP_OGRENCILER,
  OKUL_TAKIP_RAPORLAR,
  OKUL_TAKIP_RISKLI,
} from "@/modules/davet/okul-takip/routes";
import { todayIso, useOkulTakipStore } from "@/modules/davet/okul-takip/store";

export default function OkulTakipHubPage() {
  const { students, dailyRecords } = useOkulTakipStore();
  const today = todayIso();
  const activeStudents = students.filter((s) => s.isActive);
  const activeIds = activeStudents.map((s) => s.id);

  const todayRecords = dailyRecords.filter(
    (r) => r.date === today && activeIds.includes(r.studentId),
  );
  const summary = computeDailySummary(todayRecords, activeIds);

  const riskCount = useMemo(() => {
    const dates = getLast7Dates(today);
    return activeStudents.filter(
      (s) => detectRiskStudent(s, dailyRecords, dates) !== null,
    ).length;
  }, [activeStudents, dailyRecords, today]);

  return (
    <DavetLayout>
      <div className="space-y-6 pb-8">
        <BackButton label="Nehari Platformu" href={NEHARI_PLATFORM_HOME} />

        <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg">
              <ClipboardCheck size={28} aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Okul Ödevi ve Yoklama Takibi
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Günlük yoklama ve okul ödevi takibi, haftalık analizli kişisel karneler.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Bugünkü öğrenci" value={summary.total} />
          <StatCard label="Var" value={summary.present} tone="green" />
          <StatCard label="Yok" value={summary.absent} tone="red" />
          <StatCard label="Ödev tamam" value={summary.hwCompleted} tone="green" />
          <StatCard label="Ödev eksik/yok" value={summary.hwIncomplete + summary.hwNotDone} tone="amber" />
          <StatCard label="Riskli öğrenci" value={riskCount} tone="red" sub="Haftalık" />
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Hızlı erişim</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <ActionCard
              title="Günlük Takip"
              description="Yoklama ve okul ödevi durumunu hızlıca işaretleyin."
              href={OKUL_TAKIP_GUNLUK}
              icon={ClipboardList}
            />
            <ActionCard
              title="Raporlar"
              description="Günlük ve haftalık raporları tek sayfada görün."
              href={OKUL_TAKIP_RAPORLAR}
              icon={BarChart3}
              accent="from-blue-500 to-cyan-600"
            />
            <ActionCard
              title="Karneler"
              description="Haftalık analizli, veliye gönderilebilir kişisel karneler."
              href={OKUL_TAKIP_KARNELER}
              icon={ClipboardCheck}
              accent="from-emerald-500 to-teal-600"
            />
            <ActionCard
              title="Riskli Öğrenciler"
              description="Takip gerektiren öğrencileri otomatik listeleyin."
              href={OKUL_TAKIP_RISKLI}
              icon={AlertTriangle}
              accent="from-orange-500 to-red-500"
            />
            <ActionCard
              title="Öğrenci Listesi"
              description="Öğrenci bilgilerini görüntüleyin ve düzenleyin."
              href={OKUL_TAKIP_OGRENCILER}
              icon={Users}
              accent="from-slate-600 to-slate-800"
            />
          </div>
        </div>
      </div>
    </DavetLayout>
  );
}
