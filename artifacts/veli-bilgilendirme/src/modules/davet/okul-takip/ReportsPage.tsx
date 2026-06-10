import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Copy, Download, Image } from "lucide-react";
import { DavetLayout } from "@/modules/davet/layout/DavetLayout";
import { BackButton } from "@/modules/davet/layout/ModulePageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/modules/davet/okul-takip/components/StatCard";
import {
  buildDailyWhatsAppText,
  computeDailySummary,
  computeWeeklyStats,
  detectRiskStudent,
  formatDateTr,
  formatWeekRange,
  getLast7Dates,
  getWeekRange,
} from "@/modules/davet/okul-takip/calculations";
import { RISK_ACTIONS } from "@/modules/davet/okul-takip/constants";
import { getGroups, getInstitutions } from "@/modules/davet/okul-takip/mockData";
import { OKUL_TAKIP_HOME, OKUL_TAKIP_KARNELER } from "@/modules/davet/okul-takip/routes";
import { todayIso, useOkulTakipStore } from "@/modules/davet/okul-takip/store";
import { exportElementAsPng, exportElementAsPdf } from "@/modules/davet/utils/exportUtils";

export default function ReportsPage() {
  const { students, dailyRecords } = useOkulTakipStore();
  const [date, setDate] = useState(todayIso());
  const [institution, setInstitution] = useState("all");
  const [group, setGroup] = useState("all");
  const [weekRef, setWeekRef] = useState(todayIso());
  const reportRef = useRef<HTMLDivElement>(null);

  const institutions = useMemo(() => getInstitutions(students), [students]);
  const groups = useMemo(
    () => getGroups(students, institution === "all" ? undefined : institution),
    [students, institution],
  );

  const filteredStudents = useMemo(
    () =>
      students
        .filter((s) => s.isActive)
        .filter((s) => institution === "all" || s.institution === institution)
        .filter((s) => group === "all" || s.group === group),
    [students, institution, group],
  );

  const studentIds = filteredStudents.map((s) => s.id);
  const dayRecords = dailyRecords.filter(
    (r) => r.date === date && studentIds.includes(r.studentId),
  );
  const summary = computeDailySummary(dayRecords, studentIds);

  const { start, end, dates } = getWeekRange(weekRef);
  const weekStats = filteredStudents.map((s) => ({
    student: s,
    stats: computeWeeklyStats(s.id, dailyRecords, dates),
  }));
  const avgAtt =
    weekStats.length === 0
      ? 0
      : Math.round(weekStats.reduce((a, w) => a + w.stats.attendanceRate, 0) / weekStats.length);
  const avgHw =
    weekStats.length === 0
      ? 0
      : Math.round(weekStats.reduce((a, w) => a + w.stats.homeworkRate, 0) / weekStats.length);

  const sortedBest = [...weekStats].sort(
    (a, b) => b.stats.generalScore - a.stats.generalScore,
  );
  const sortedWorst = [...weekStats].sort(
    (a, b) => a.stats.generalScore - b.stats.generalScore,
  );

  const last7 = getLast7Dates(todayIso());
  const riskList = filteredStudents
    .map((s) => detectRiskStudent(s, dailyRecords, last7))
    .filter(Boolean);

  const whatsAppText = buildDailyWhatsAppText(
    date,
    institution === "all" ? "Tüm kurumlar" : institution,
    group === "all" ? "" : group,
    summary,
  );

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Panoya kopyalandı.");
  };

  const exportReport = async (format: "png" | "pdf") => {
    const spec = { width: 800, height: 1000, orientation: "portrait" as const };
    try {
      if (format === "png") {
        await exportElementAsPng(reportRef.current, `gunluk-rapor-${date}.png`, spec);
      } else {
        await exportElementAsPdf(reportRef.current, `gunluk-rapor-${date}.pdf`, "portrait", spec);
      }
      toast.success(`${format.toUpperCase()} indirildi.`);
    } catch {
      toast.error("Dışa aktarma başarısız.");
    }
  };

  const listByAttendance = (status: string) =>
    dayRecords
      .filter((r) => r.attendanceStatus === status)
      .map((r) => filteredStudents.find((s) => s.id === r.studentId)?.name)
      .filter(Boolean);

  const listByHomework = (status: string) =>
    dayRecords
      .filter((r) => r.homeworkStatus === status)
      .map((r) => filteredStudents.find((s) => s.id === r.studentId)?.name)
      .filter(Boolean);

  return (
    <DavetLayout>
      <div className="space-y-5 pb-8">
        <BackButton label="Okul Takip Ana Sayfası" href={OKUL_TAKIP_HOME} />
        <h1 className="text-xl font-bold">Raporlar</h1>

        <Tabs defaultValue="daily">
          <TabsList className="flex h-auto flex-wrap gap-1">
            <TabsTrigger value="daily">Günlük Rapor</TabsTrigger>
            <TabsTrigger value="weekly">Haftalık Rapor</TabsTrigger>
            <TabsTrigger value="karneler">Kişisel Karneler</TabsTrigger>
            <TabsTrigger value="risk">Riskli Öğrenciler</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Tarih</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Kurum</label>
                <Select value={institution} onValueChange={setInstitution}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {institutions.map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Grup</label>
                <Select value={group} onValueChange={setGroup}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div ref={reportRef} className="rounded-2xl border bg-white p-5">
              <h2 className="text-lg font-bold">{formatDateTr(date)}</h2>
              <p className="text-sm text-slate-500">
                {institution === "all" ? "Tüm kurumlar" : institution}
                {group !== "all" ? ` · ${group}` : ""}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatCard label="Toplam" value={summary.total} className="p-3" />
                <StatCard label="Var" value={summary.present} tone="green" className="p-3" />
                <StatCard label="Yok" value={summary.absent} tone="red" className="p-3" />
                <StatCard label="Mazeretli" value={summary.excused} tone="blue" className="p-3" />
                <StatCard label="Geç gelen" value={summary.late} tone="amber" className="p-3" />
                <StatCard label="Ödev tamam" value={summary.hwCompleted} tone="green" className="p-3" />
                <StatCard label="Eksik" value={summary.hwIncomplete} tone="amber" className="p-3" />
                <StatCard label="Yapmamış" value={summary.hwNotDone} tone="red" className="p-3" />
              </div>
              <ReportList title="Var olanlar" items={listByAttendance("present") as string[]} />
              <ReportList title="Yok olanlar" items={listByAttendance("absent") as string[]} />
              <ReportList title="Mazeretli" items={listByAttendance("excused") as string[]} />
              <ReportList title="Geç gelenler" items={listByAttendance("late") as string[]} />
              <ReportList title="Ödevi eksik" items={listByHomework("incomplete") as string[]} />
              <ReportList title="Ödevi yapmamış" items={listByHomework("not_done") as string[]} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => copyText(whatsAppText)}>
                <Copy size={16} className="mr-2" />
                WhatsApp metni
              </Button>
              <Button variant="outline" onClick={() => exportReport("pdf")}>
                <Download size={16} className="mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={() => exportReport("png")}>
                <Image size={16} className="mr-2" />
                PNG
              </Button>
              <Button variant="outline" onClick={() => copyText(whatsAppText)}>
                Kopyala
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="weekly" className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Hafta</label>
              <Input type="date" value={weekRef} onChange={(e) => setWeekRef(e.target.value)} />
              <p className="mt-1 text-sm text-slate-600">{formatWeekRange(start, end)}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard label="Ort. katılım" value={`%${avgAtt}`} tone="blue" />
              <StatCard label="Ort. ödev düzeni" value={`%${avgHw}`} tone="indigo" />
            </div>
            <ReportList
              title="En düzenli öğrenciler"
              items={sortedBest.slice(0, 5).map(
                (w) => `${w.student.name} (%${w.stats.generalScore})`,
              )}
            />
            <ReportList
              title="Takip edilmesi gerekenler"
              items={sortedWorst.slice(0, 5).map(
                (w) => `${w.student.name} (%${w.stats.generalScore})`,
              )}
            />
            <div>
              <h3 className="mb-2 font-semibold">Gün gün özet</h3>
              <div className="space-y-2">
                {dates.map((d) => {
                  const dayRecs = dailyRecords.filter(
                    (r) => r.date === d && studentIds.includes(r.studentId),
                  );
                  const ds = computeDailySummary(dayRecs, studentIds);
                  return (
                    <div key={d} className="rounded-lg border bg-white px-3 py-2 text-sm">
                      <span className="font-medium">{formatDateTr(d)}</span>
                      <span className="ml-3 text-slate-500">
                        Var {ds.present} · Yok {ds.absent} · Tamam {ds.hwCompleted}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="karneler" className="mt-4">
            <p className="text-sm text-slate-600">
              Detaylı karneler için{" "}
              <Link href={OKUL_TAKIP_KARNELER} className="font-semibold text-violet-600 underline">
                Karneler
              </Link>{" "}
              sayfasına gidin.
            </p>
          </TabsContent>

          <TabsContent value="risk" className="mt-4 space-y-3">
            {riskList.length === 0 ? (
              <p className="text-sm text-slate-600">Riskli öğrenci bulunmuyor.</p>
            ) : (
              riskList.map((r) =>
                r ? (
                  <div key={r.student.id} className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                    <p className="font-bold">{r.student.name}</p>
                    <p className="text-xs text-slate-500">
                      {r.student.grade} · Katılım %{r.attendanceRate} · Ödev %{r.homeworkRate}
                    </p>
                    <p className="mt-2 text-sm">
                      {r.reasons.map((reason) => RISK_ACTIONS[reason] ?? reason).join(" · ")}
                    </p>
                  </div>
                ) : null,
              )
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DavetLayout>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
      <p className="mt-1 text-sm text-slate-700">{items.join(", ")}</p>
    </div>
  );
}
