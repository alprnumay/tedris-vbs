import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Eye, Loader2, MessageCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  buildKarneAnalysis,
  buildTeacherCommentSuggestion,
  computeWeeklyStats,
  getWeekRange,
} from "@/modules/davet/okul-takip/calculations";
import { getKarneData, KarnePoster } from "@/modules/davet/okul-takip/components/KarnePoster";
import { shareKarnePng } from "@/modules/davet/okul-takip/karneExport";
import { GENERAL_STATUS_COLORS, GENERAL_STATUS_LABELS, OKUL_TAKIP_HOME_BACK_LABEL } from "@/modules/davet/okul-takip/constants";
import { getGrades, getGroups, getInstitutions } from "@/modules/davet/okul-takip/mockData";
import type { GeneralStatus, Student, WeeklyStats } from "@/modules/davet/okul-takip/types";
import {
  OKUL_TAKIP_HOME,
  OKUL_TAKIP_KARNELER,
  okulTakipKarnePath,
} from "@/modules/davet/okul-takip/routes";
import { todayIso, useOkulTakipStore } from "@/modules/davet/okul-takip/store";

export default function KarnelerPage() {
  const { students, dailyRecords } = useOkulTakipStore();
  const [search, setSearch] = useState("");
  const [institution, setInstitution] = useState("all");
  const [grade, setGrade] = useState("all");
  const [group, setGroup] = useState("all");
  const [weekRef, setWeekRef] = useState(todayIso());
  const [statusFilter, setStatusFilter] = useState<GeneralStatus | "all">("all");
  const [onlyRisk, setOnlyRisk] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [pendingShare, setPendingShare] = useState<{
    student: Student;
    stats: WeeklyStats;
    start: string;
    end: string;
    teacherComment: string;
    message: string;
  } | null>(null);
  const sharePosterRef = useRef<HTMLDivElement>(null);

  const institutions = useMemo(() => getInstitutions(students), [students]);
  const grades = useMemo(() => getGrades(students), [students]);
  const groups = useMemo(
    () => getGroups(students, institution === "all" ? undefined : institution),
    [students, institution],
  );
  const { dates } = getWeekRange(weekRef);

  const cards = useMemo(() => {
    return students
      .filter((s) => s.isActive)
      .filter((s) => institution === "all" || s.institution === institution)
      .filter((s) => grade === "all" || s.grade === grade)
      .filter((s) => group === "all" || s.group === group)
      .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()))
      .map((s) => {
        const stats = computeWeeklyStats(s.id, dailyRecords, dates);
        return { student: s, stats };
      })
      .filter((c) => statusFilter === "all" || c.stats.generalStatus === statusFilter)
      .filter((c) => !onlyRisk || c.stats.generalStatus === "at_risk" || c.stats.generalScore < 50)
      .sort((a, b) => a.student.name.localeCompare(b.student.name, "tr"));
  }, [students, dailyRecords, dates, institution, grade, group, search, statusFilter, onlyRisk]);

  const sendWhatsAppKarne = (studentId: string) => {
    const item = cards.find((c) => c.student.id === studentId);
    if (!item) return;
    if (!item.student.parentPhone?.trim()) {
      toast.warning("Bu öğrenci için veli telefon numarası bulunamadı.");
      return;
    }
    const { start, end } = getKarneData(item.student, dailyRecords, weekRef);
    const weekNote = dailyRecords
      .filter((r) => r.studentId === item.student.id && dates.includes(r.date) && r.note)
      .map((r) => r.note)
      .join(" ");
    const teacherComment = buildTeacherCommentSuggestion(item.student, item.stats, weekNote);
    const analysis = buildKarneAnalysis(item.student, item.stats, teacherComment);
    setSharingId(studentId);
    setPendingShare({
      student: item.student,
      stats: item.stats,
      start,
      end,
      teacherComment,
      message: analysis.whatsAppMessage,
    });
  };

  useEffect(() => {
    if (!pendingShare) return;
    let cancelled = false;
    const run = async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (cancelled) return;
      try {
        const result = await shareKarnePng(
          sharePosterRef.current,
          pendingShare.student.name,
          pendingShare.message,
        );
        if (result === "shared") {
          toast.success("Karne WhatsApp paylaşımı için hazırlandı.");
        } else {
          toast.info("Karne indirildi. WhatsApp üzerinden veliye gönderebilirsiniz.");
          window.open(
            `https://wa.me/${pendingShare.student.parentPhone.replace(/\D/g, "")}`,
            "_blank",
            "noopener,noreferrer",
          );
        }
      } catch (err) {
        console.error("[karne/list-share]", err);
        toast.error("Karne indirilemedi. Lütfen tekrar deneyin.");
      } finally {
        if (!cancelled) {
          setPendingShare(null);
          setSharingId(null);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [pendingShare]);

  return (
    <DavetLayout>
      <div className="space-y-5 pb-8">
        <BackButton label={OKUL_TAKIP_HOME_BACK_LABEL} href={OKUL_TAKIP_HOME} />
        <h1 className="text-xl font-bold">Kişisel Karneler</h1>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input placeholder="Öğrenci ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={institution} onValueChange={setInstitution}>
            <SelectTrigger>
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
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger>
              <SelectValue placeholder="Sınıf" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm sınıflar</SelectItem>
              {grades.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Grup" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm gruplar</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={weekRef} onChange={(e) => setWeekRef(e.target.value)} />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as GeneralStatus | "all")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm durumlar</SelectItem>
              {(Object.keys(GENERAL_STATUS_LABELS) as GeneralStatus[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {GENERAL_STATUS_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyRisk}
            onChange={(e) => setOnlyRisk(e.target.checked)}
            className="rounded"
          />
          Sadece riskli öğrenciler
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map(({ student, stats }) => {
            const style = GENERAL_STATUS_COLORS[stats.generalStatus];
            return (
              <div
                key={student.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{student.name}</p>
                    <p className="text-xs text-slate-500">
                      {student.grade} · {student.institution}
                    </p>
                  </div>
                  <Badge className={cnBadge(style)} variant="outline">
                    {GENERAL_STATUS_LABELS[stats.generalStatus]}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
                    <p className="text-xs text-blue-600">Katılım</p>
                    <p className="font-bold text-blue-800">%{stats.attendanceRate}</p>
                  </div>
                  <div className="rounded-lg bg-violet-50 px-3 py-2 text-center">
                    <p className="text-xs text-violet-600">Ödev</p>
                    <p className="font-bold text-violet-800">%{stats.homeworkRate}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={okulTakipKarnePath(student.id, weekRef)}>
                    <Button size="sm" variant="default" className="bg-violet-600 hover:bg-violet-700">
                      <Eye size={14} className="mr-1" />
                      Karneyi aç
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendWhatsAppKarne(student.id)}
                    disabled={sharingId === student.id}
                  >
                    {sharingId === student.id ? (
                      <Loader2 size={14} className="mr-1 animate-spin" />
                    ) : (
                      <MessageCircle size={14} className="mr-1" />
                    )}
                    Karneyi WhatsApp
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {pendingShare ? (
          <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none" aria-hidden="true">
            <KarnePoster
              ref={sharePosterRef}
              student={pendingShare.student}
              stats={pendingShare.stats}
              weekStart={pendingShare.start}
              weekEnd={pendingShare.end}
              records={dailyRecords}
              teacherComment={pendingShare.teacherComment}
            />
          </div>
        ) : null}
      </div>
    </DavetLayout>
  );
}

function cnBadge(style: { bg: string; text: string; border: string }) {
  return `${style.bg} ${style.text} ${style.border}`;
}
