import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Layers, Loader2, Save, Search, StickyNote } from "lucide-react";
import { DavetLayout } from "@/modules/davet/layout/DavetLayout";
import { BackButton } from "@/modules/davet/layout/ModulePageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BulkActionSheet } from "@/modules/davet/okul-takip/components/BulkActionSheet";
import {
  AttendanceButtonGroup,
  HomeworkButtonGroup,
} from "@/modules/davet/okul-takip/components/StatusButtonGroup";
import { DailyTrackingProgress } from "@/modules/davet/okul-takip/components/DailyTrackingProgress";
import {
  applyAbsentHomework,
  applyHomeworkToAttendance,
  isHomeworkDisabled,
} from "@/modules/davet/okul-takip/calculations";
import { isStudentMarked } from "@/modules/davet/okul-takip/dailyTrackingHelpers";
import { getInstitutions } from "@/modules/davet/okul-takip/mockData";
import type { AttendanceStatus, DailyDraft, DailyRecord, HomeworkStatus, Student } from "@/modules/davet/okul-takip/types";
import { OKUL_TAKIP_HOME } from "@/modules/davet/okul-takip/routes";
import { getOkulTakipUserMessage } from "@/modules/davet/okul-takip/okulTakipApi";
import {
  generateId,
  getRecordForStudentDate,
  todayIso,
  upsertDailyRecords,
  useOkulTakipStore,
} from "@/modules/davet/okul-takip/store";

function emptyDraft(studentId: string): DailyDraft {
  return { studentId, attendanceStatus: null, homeworkStatus: null, note: "" };
}

export default function DailyTrackingPage() {
  const { students, dailyRecords, loading, ready } = useOkulTakipStore();
  const [date, setDate] = useState(todayIso());
  const [institution, setInstitution] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [onlyUnmarked, setOnlyUnmarked] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, DailyDraft>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteStudentId, setNoteStudentId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const institutions = useMemo(() => getInstitutions(students), [students]);

  const baseStudents = useMemo(
    () =>
      students
        .filter((s) => s.isActive)
        .filter((s) => institution === "all" || s.institution === institution)
        .filter((s) => groupFilter === "all" || s.group === groupFilter),
    [students, institution, groupFilter],
  );

  const groupOptions = useMemo(
    () => [...new Set(baseStudents.map((s) => s.group).filter(Boolean))].sort(),
    [baseStudents],
  );

  useEffect(() => {
    const next: Record<string, DailyDraft> = {};
    for (const s of baseStudents) {
      const rec = getRecordForStudentDate(dailyRecords, s.id, date);
      next[s.id] = {
        studentId: s.id,
        attendanceStatus: rec?.attendanceStatus ?? null,
        homeworkStatus: rec?.homeworkStatus ?? null,
        note: rec?.note ?? "",
      };
    }
    setDrafts(next);
    setDirty(false);
    setNoteStudentId(null);
  }, [baseStudents, dailyRecords, date]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const updateDraft = useCallback((studentId: string, patch: Partial<DailyDraft>) => {
    setDrafts((prev) => {
      const current = prev[studentId] ?? emptyDraft(studentId);
      return { ...prev, [studentId]: { ...current, ...patch } };
    });
    setDirty(true);
  }, []);

  const applyBulk = useCallback(
    (targets: Student[], updater: (draft: DailyDraft) => DailyDraft) => {
      setDrafts((prev) => {
        const next = { ...prev };
        for (const s of targets) {
          const current = next[s.id] ?? emptyDraft(s.id);
          next[s.id] = updater(current);
        }
        return next;
      });
      setDirty(true);
    },
    [],
  );

  const setAttendance = useCallback((studentId: string, status: AttendanceStatus) => {
    setDrafts((prev) => {
      const current = prev[studentId] ?? emptyDraft(studentId);
      const updated: DailyDraft =
        status === "absent"
          ? {
              ...current,
              attendanceStatus: status,
              homeworkStatus: applyAbsentHomework(),
            }
          : { ...current, attendanceStatus: status };
      return { ...prev, [studentId]: updated };
    });
    setDirty(true);
  }, []);

  const setHomework = useCallback((studentId: string, status: HomeworkStatus) => {
    setDrafts((prev) => {
      const current = prev[studentId] ?? emptyDraft(studentId);
      if (isHomeworkDisabled(current.attendanceStatus)) return prev;

      const updated: DailyDraft = {
        ...current,
        homeworkStatus: status,
        attendanceStatus: applyHomeworkToAttendance(),
      };
      return { ...prev, [studentId]: updated };
    });
    setDirty(true);
  }, []);

  const displayStudents = useMemo(() => {
    return baseStudents
      .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()))
      .filter((s) => !onlyUnmarked || !isStudentMarked(drafts[s.id]))
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [baseStudents, search, onlyUnmarked, drafts]);

  const markedCount = useMemo(
    () => baseStudents.filter((s) => isStudentMarked(drafts[s.id])).length,
    [baseStudents, drafts],
  );

  const saveAll = async () => {
    setSaving(true);
    try {
      const records: DailyRecord[] = scopeStudentsForSave(baseStudents, drafts, dailyRecords, date);
      await upsertDailyRecords(records);
      setDirty(false);
      toast.success("Günlük takip kaydedildi.");
    } catch (err) {
      toast.error(getOkulTakipUserMessage(err, "Günlük kayıt kaydedilemedi. Lütfen tekrar deneyin."));
    } finally {
      setSaving(false);
    }
  };

  const bulkPresentAndComplete = () => {
    applyBulk(baseStudents, (d) => {
      if (d.attendanceStatus === "absent") return d;
      return { ...d, attendanceStatus: "present", homeworkStatus: "completed" };
    });
  };

  const bulkPresent = () => {
    applyBulk(baseStudents, (d) => ({ ...d, attendanceStatus: "present" }));
  };

  const bulkUnmarkedAbsent = () => {
    applyBulk(
      baseStudents.filter((s) => !isStudentMarked(drafts[s.id])),
      (d) => ({
        ...d,
        attendanceStatus: "absent",
        homeworkStatus: applyAbsentHomework(),
      }),
    );
  };

  const bulkNotChecked = () => {
    applyBulk(baseStudents, (d) => {
      if (d.attendanceStatus === "absent") return d;
      return {
        ...d,
        attendanceStatus: d.attendanceStatus ?? "present",
        homeworkStatus: "not_checked",
      };
    });
  };

  const clearAll = () => {
    applyBulk(baseStudents, (d) => ({
      ...d,
      attendanceStatus: null,
      homeworkStatus: null,
      note: "",
    }));
  };

  if (!ready && loading) {
    return (
      <DavetLayout>
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Veriler yükleniyor…
        </div>
      </DavetLayout>
    );
  }

  return (
    <DavetLayout>
      <div className="space-y-4 pb-28">
        <BackButton label="Okul Takip Ana Sayfası" href={OKUL_TAKIP_HOME} />

        <div>
          <h1 className="text-xl font-bold text-slate-900">Günlük Takip</h1>
          <p className="text-sm text-slate-600">Yoklama ve okul ödevi takibi</p>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Filtreler</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs text-slate-500">Tarih</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-slate-500">Kurum</Label>
              <Select value={institution} onValueChange={setInstitution}>
                <SelectTrigger>
                  <SelectValue placeholder="Kurum" />
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
              <Label className="mb-1.5 block text-xs text-slate-500">Grup</Label>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Grup" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm gruplar</SelectItem>
                  {groupOptions.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-slate-500">Arama</Label>
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  className="pl-9"
                  placeholder="Öğrenci adı..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <Label htmlFor="only-unmarked" className="text-sm font-medium text-slate-700">
              Sadece işaretlenmemişler
            </Label>
            <Switch id="only-unmarked" checked={onlyUnmarked} onCheckedChange={setOnlyUnmarked} />
          </div>
        </div>

        <DailyTrackingProgress total={baseStudents.length} marked={markedCount} />

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Layers size={16} className="mr-2" />
            Toplu İşlem
          </Button>
        </div>

        <BulkActionSheet
          open={bulkOpen}
          onOpenChange={setBulkOpen}
          actions={[
            { label: "Hepsini Var + Ödev Tamam yap", onSelect: bulkPresentAndComplete },
            { label: "Hepsini Var yap", onSelect: bulkPresent },
            { label: "İşaretlenmeyenleri Yok yap", onSelect: bulkUnmarkedAbsent },
            { label: "Ödevi kontrol edilmedi yap", onSelect: bulkNotChecked },
            {
              label: "Tümünü temizle",
              onSelect: clearAll,
              variant: "destructive",
            },
          ]}
        />

        <div className="space-y-3">
          {displayStudents.length === 0 ? (
            <p className="rounded-xl border bg-white p-6 text-center text-sm text-slate-500">
              {baseStudents.length === 0
                ? "Henüz öğrenci yok. Öğrencilerim sayfasından ekleyin."
                : "Bu filtrede öğrenci bulunamadı."}
            </p>
          ) : (
            displayStudents.map((student) => {
              const draft = drafts[student.id];
              const hwDisabled = isHomeworkDisabled(draft?.attendanceStatus ?? null);
              const unmarked = !isStudentMarked(draft);

              return (
                <div
                  key={student.id}
                  className={cn(
                    "rounded-2xl border bg-white p-4 shadow-sm",
                    unmarked ? "border-amber-200" : "border-slate-200",
                  )}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">{student.name}</p>
                      <p className="text-xs text-slate-500">
                        {student.grade} · {student.group}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        setNoteStudentId(noteStudentId === student.id ? null : student.id)
                      }
                    >
                      <StickyNote size={16} />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Yoklama
                      </p>
                      <AttendanceButtonGroup
                        compact
                        showIcons={false}
                        value={draft?.attendanceStatus ?? null}
                        onChange={(v) => setAttendance(student.id, v)}
                      />
                    </div>
                    <div>
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Ödev
                      </p>
                      <HomeworkButtonGroup
                        compact
                        showIcons={false}
                        value={draft?.homeworkStatus ?? null}
                        onChange={(v) => setHomework(student.id, v)}
                        disabled={hwDisabled}
                      />
                    </div>
                    {noteStudentId === student.id ? (
                      <Textarea
                        placeholder="Kısa not..."
                        value={draft?.note ?? ""}
                        onChange={(e) => updateDraft(student.id, { note: e.target.value })}
                        rows={2}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <p className="min-w-0 flex-1 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">{baseStudents.length}</span> öğrenciden{" "}
            <span className="font-semibold text-violet-700">{markedCount}</span>&apos;ü işaretlendi
            {dirty ? (
              <span className="ml-1 text-xs text-amber-700">· kaydedilmedi</span>
            ) : null}
          </p>
          <Button
            size="lg"
            className="shrink-0 bg-violet-600 px-6 hover:bg-violet-700"
            onClick={() => void saveAll()}
            disabled={saving || baseStudents.length === 0}
          >
            {saving ? (
              <Loader2 size={18} className="mr-2 animate-spin" />
            ) : (
              <Save size={18} className="mr-2" />
            )}
            Kaydet
          </Button>
        </div>
      </div>
    </DavetLayout>
  );
}

function scopeStudentsForSave(
  students: Student[],
  drafts: Record<string, DailyDraft>,
  dailyRecords: DailyRecord[],
  date: string,
): DailyRecord[] {
  return students.map((s) => {
    const d = drafts[s.id] ?? emptyDraft(s.id);
    const existing = getRecordForStudentDate(dailyRecords, s.id, date);
    return {
      id: existing?.id ?? generateId("dr"),
      studentId: s.id,
      date,
      institution: s.institution,
      group: s.group,
      attendanceStatus: d.attendanceStatus,
      homeworkStatus: d.homeworkStatus,
      note: d.note,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}
