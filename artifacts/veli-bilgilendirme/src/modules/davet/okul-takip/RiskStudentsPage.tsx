import { useMemo, useState } from "react";
import { DavetLayout } from "@/modules/davet/layout/DavetLayout";
import { BackButton } from "@/modules/davet/layout/ModulePageHeader";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/modules/davet/okul-takip/components/StatCard";
import { detectRiskStudent, getLast7Dates } from "@/modules/davet/okul-takip/calculations";
import { RISK_ACTIONS } from "@/modules/davet/okul-takip/constants";
import { getInstitutions } from "@/modules/davet/okul-takip/mockData";
import type { RiskReason } from "@/modules/davet/okul-takip/types";
import { OKUL_TAKIP_HOME } from "@/modules/davet/okul-takip/routes";
import { todayIso, useOkulTakipStore } from "@/modules/davet/okul-takip/store";

const REASON_LABELS: Record<RiskReason, string> = {
  low_general: "Genel puan %50 altında",
  low_attendance: "Katılım oranı %50 altında",
  low_homework: "Ödev düzeni %50 altında",
  consecutive_absent: "Üst üste 2+ yok",
  consecutive_homework: "Üst üste 2+ eksik/yapmamış",
  no_records: "Son 7 günde kayıt yok",
};

export default function RiskStudentsPage() {
  const { students, dailyRecords } = useOkulTakipStore();
  const [institution, setInstitution] = useState("all");
  const institutions = useMemo(() => getInstitutions(students), [students]);
  const last7 = getLast7Dates(todayIso());

  const riskList = useMemo(() => {
    return students
      .filter((s) => s.isActive)
      .filter((s) => institution === "all" || s.institution === institution)
      .map((s) => detectRiskStudent(s, dailyRecords, last7))
      .filter(Boolean)
      .sort((a, b) => (a!.generalScore) - (b!.generalScore));
  }, [students, dailyRecords, institution, last7]);

  return (
    <DavetLayout>
      <div className="space-y-5 pb-8">
        <BackButton label="Okul Takip Ana Sayfası" href={OKUL_TAKIP_HOME} />
        <div>
          <h1 className="text-xl font-bold text-slate-900">Riskli Öğrenciler</h1>
          <p className="text-sm text-slate-600">
            Otomatik risk kurallarına göre takip gerektiren öğrenciler.
          </p>
        </div>

        <Select value={institution} onValueChange={setInstitution}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Kurum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm kurumlar</SelectItem>
            {institutions.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <StatCard
          label="Riskli öğrenci sayısı"
          value={riskList.length}
          tone="red"
          className="max-w-xs"
        />

        <div className="space-y-4">
          {riskList.length === 0 ? (
            <p className="rounded-xl border bg-white p-6 text-center text-sm text-slate-600">
              Şu an riskli öğrenci bulunmuyor.
            </p>
          ) : (
            riskList.map((r) =>
              r ? (
                <div
                  key={r.student.id}
                  className="rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-50/80 to-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-slate-900">{r.student.name}</p>
                      <p className="text-sm text-slate-500">
                        {r.student.grade} · {r.student.institution} · {r.student.group}
                      </p>
                    </div>
                    <Badge variant="destructive">Risk</Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.reasons.map((reason) => (
                      <Badge key={reason} variant="outline" className="border-red-200 bg-white">
                        {REASON_LABELS[reason]}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-lg bg-white px-2 py-2 ring-1 ring-slate-200">
                      <p className="text-xs text-slate-500">Katılım</p>
                      <p className="font-bold text-red-700">%{r.attendanceRate}</p>
                    </div>
                    <div className="rounded-lg bg-white px-2 py-2 ring-1 ring-slate-200">
                      <p className="text-xs text-slate-500">Ödev</p>
                      <p className="font-bold text-red-700">%{r.homeworkRate}</p>
                    </div>
                    <div className="rounded-lg bg-white px-2 py-2 ring-1 ring-slate-200">
                      <p className="text-xs text-slate-500">Genel</p>
                      <p className="font-bold text-red-700">%{r.generalScore}</p>
                    </div>
                  </div>

                  <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <span className="font-semibold">Önerilen hamle: </span>
                    {r.suggestedAction}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {r.reasons.map((reason) => RISK_ACTIONS[reason]).join(" · ")}
                  </p>
                </div>
              ) : null,
            )
          )}
        </div>
      </div>
    </DavetLayout>
  );
}
