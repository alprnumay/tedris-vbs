import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Save, Search, StickyNote } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AttendanceButtonGroup,
  HomeworkButtonGroup,
} from "@/modules/davet/okul-takip/components/StatusButtonGroup";
import { DailyTrackingListRow } from "@/modules/davet/okul-takip/components/DailyTrackingListRow";
import { DailyTrackingProgress } from "@/modules/davet/okul-takip/components/DailyTrackingProgress";
import { DailyTrackingSequentialView } from "@/modules/davet/okul-takip/components/DailyTrackingSequentialView";
import {
  applyAbsentHomework,
  applyHomeworkToAttendance,
  isHomeworkDisabled,
} from "@/modules/davet/okul-takip/calculations";
import {
  buildTabOptions,
  isStudentMarked,
  matchesStatusFilter,
  matchesTabFilter,
  parseTabKey,
  STATUS_FILTER_OPTIONS,
  VIEW_MODE_OPTIONS,
  type StatusFilter,
  type ViewMode,
} from "@/modules/davet/okul-takip/dailyTrackingHelpers";
import { getInstitutions } from "@/modules/davet/okul-takip/mockData";
import type { AttendanceStatus, DailyDraft, DailyRecord, HomeworkStatus, Student } from "@/modules/davet/okul-takip/types";
import { OKUL_TAKIP_HOME } from "@/modules/davet/okul-takip/routes";
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
  const { students, dailyRecords } = useOkulTakipStore();
  const [date, setDate] = useState(todayIso());
  const [institution, setInstitution] = useState<string>("all");
  const [tabKey, setTabKey] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [hideMarkedOnly, setHideMarkedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [drafts, setDrafts] = useState<Record<string, DailyDraft>>({});
  const [dirty, setDirty] = useState(false);
  const [noteStudentId, setNoteStudentId] = useState<string | null>(null);
  const [sequentialIndex, setSequentialIndex] = useState(0);

  const institutions = useMemo(() => getInstitutions(students), [students]);
  const tabFilter = parseTabKey(tabKey);

  const baseStudents = useMemo(
    () =>
      students
        .filter((s) => s.isActive)
        .filter((s) => institution === "all" || s.institution === institution),
    [students, institution],
  );

  const tabOptions = useMemo(() => buildTabOptions(baseStudents), [baseStudents]);

  const scopeStudents = useMemo(
    () => baseStudents.filter((s) => matchesTabFilter(s, tabFilter)),
    [baseStudents, tabFilter],
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
    setSequentialIndex(0);
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

  const advanceSequential = useCallback(
    (fromStudentId?: string) => {
      setDrafts((currentDrafts) => {
        const list = scopeStudents
          .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()))
          .filter((s) => matchesStatusFilter(currentDrafts[s.id], statusFilter))
          .filter((s) => !hideMarkedOnly || !isStudentMarked(currentDrafts[s.id]))
          .sort((a, b) => a.name.localeCompare(b.name, "tr"));

        if (list.length === 0) return currentDrafts;

        const currentIdx = fromStudentId
          ? list.findIndex((s) => s.id === fromStudentId)
          : sequentialIndex;

        const nextUnmarked = list.findIndex(
          (s, i) => i > currentIdx && !isStudentMarked(currentDrafts[s.id]),
        );
        if (nextUnmarked >= 0) {
          setSequentialIndex(nextUnmarked);
        } else {
          const firstUnmarked = list.findIndex((s) => !isStudentMarked(currentDrafts[s.id]));
          if (firstUnmarked >= 0 && firstUnmarked !== currentIdx) {
            setSequentialIndex(firstUnmarked);
          } else if (currentIdx < list.length - 1) {
            setSequentialIndex(currentIdx + 1);
          }
        }
        setNoteStudentId(null);
        return currentDrafts;
      });
    },
    [scopeStudents, search, statusFilter, hideMarkedOnly, sequentialIndex],
  );

  const setAttendance = useCallback(
    (studentId: string, status: AttendanceStatus, autoAdvance = false) => {
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

        if (autoAdvance && viewMode === "sequential" && isStudentMarked(updated)) {
          queueMicrotask(() => advanceSequential(studentId));
        }
        return { ...prev, [studentId]: updated };
      });
      setDirty(true);
    },
    [advanceSequential, viewMode],
  );

  const setHomework = useCallback(
    (studentId: string, status: HomeworkStatus, autoAdvance = false) => {
      setDrafts((prev) => {
        const current = prev[studentId] ?? emptyDraft(studentId);
        if (isHomeworkDisabled(current.attendanceStatus)) return prev;

        const updated: DailyDraft = {
          ...current,
          homeworkStatus: status,
          attendanceStatus: applyHomeworkToAttendance(),
        };

        if (autoAdvance && viewMode === "sequential" && isStudentMarked(updated)) {
          queueMicrotask(() => advanceSequential(studentId));
        }
        return { ...prev, [studentId]: updated };
      });
      setDirty(true);
    },
    [advanceSequential, viewMode],
  );

  const displayStudents = useMemo(() => {
    return scopeStudents
      .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()))
      .filter((s) => matchesStatusFilter(drafts[s.id], statusFilter))
      .filter((s) => !hideMarkedOnly || !isStudentMarked(drafts[s.id]))
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [scopeStudents, search, statusFilter, hideMarkedOnly, drafts]);

  const markedCount = useMemo(
    () => scopeStudents.filter((s) => isStudentMarked(drafts[s.id])).length,
    [scopeStudents, drafts],
  );

  useEffect(() => {
    if (sequentialIndex >= displayStudents.length) {
      setSequentialIndex(Math.max(0, displayStudents.length - 1));
    }
  }, [displayStudents.length, sequentialIndex]);

  const saveAll = () => {
    const records: DailyRecord[] = scopeStudents.map((s) => {
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
    upsertDailyRecords(records);
    setDirty(false);
    toast.success("Günlük takip kaydedildi.");
  };

  const bulkPresentAndComplete = () => {
    applyBulk(scopeStudents, (d) => {
      if (d.attendanceStatus === "absent") return d;
      return { ...d, attendanceStatus: "present", homeworkStatus: "completed" };
    });
  };

  const bulkPresent = () => {
    applyBulk(scopeStudents, (d) => ({ ...d, attendanceStatus: "present" }));
  };

  const bulkUnmarkedAbsent = () => {
    applyBulk(
      scopeStudents.filter((s) => !isStudentMarked(drafts[s.id])),
      (d) => ({
        ...d,
        attendanceStatus: "absent",
        homeworkStatus: applyAbsentHomework(),
      }),
    );
  };

  const clearAll = () => {
    applyBulk(scopeStudents, (d) => ({
      ...d,
      attendanceStatus: null,
      homeworkStatus: null,
      note: "",
    }));
  };

  const sequentialStudent = displayStudents[sequentialIndex];
  const sequentialRemaining = displayStudents.filter(
    (s) => !isStudentMarked(drafts[s.id]),
  ).length;

  return (
    <DavetLayout>
      <div className="space-y-4 pb-24">
        <BackButton label="Okul Takip Ana Sayfası" href={OKUL_TAKIP_HOME} />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Günlük Takip</h1>
            <p className="text-sm text-slate-600">Hızlı yoklama ve okul ödevi işaretleme</p>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            {VIEW_MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setViewMode(opt.value);
                  setSequentialIndex(0);
                }}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3 sm:text-sm",
                  viewMode === opt.value
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <DailyTrackingProgress
          total={scopeStudents.length}
          marked={markedCount}
        />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Tarih</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Kurum</label>
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
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Arama</label>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                className="pl-9"
                placeholder="Öğrenci adı yaz..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabOptions.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setTabKey(tab.key);
                setSequentialIndex(0);
              }}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                tabKey === tab.key
                  ? "border-violet-500 bg-violet-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-semibold",
                statusFilter === opt.value
                  ? "border-slate-800 bg-slate-800 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              {opt.label}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
            <input
              type="checkbox"
              checked={hideMarkedOnly}
              onChange={(e) => setHideMarkedOnly(e.target.checked)}
              className="rounded"
            />
            Sadece işaretlenmemişler
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" onClick={bulkPresentAndComplete}>
            Var + Ödev Tamam
          </Button>
          <Button variant="outline" size="sm" onClick={bulkPresent}>
            Hepsini Var
          </Button>
          <Button variant="outline" size="sm" onClick={bulkUnmarkedAbsent}>
            İşaretlenmeyenleri Yok
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Tümünü temizle
          </Button>
        </div>

        {viewMode === "sequential" ? (
          sequentialStudent ? (
            <DailyTrackingSequentialView
              student={sequentialStudent}
              draft={drafts[sequentialStudent.id]}
              hwDisabled={isHomeworkDisabled(drafts[sequentialStudent.id]?.attendanceStatus ?? null)}
              index={sequentialIndex}
              total={displayStudents.length}
              remaining={sequentialRemaining}
              noteOpen={noteStudentId === sequentialStudent.id}
              onToggleNote={() =>
                setNoteStudentId(
                  noteStudentId === sequentialStudent.id ? null : sequentialStudent.id,
                )
              }
              onAttendance={(v) => setAttendance(sequentialStudent.id, v, true)}
              onHomework={(v) => setHomework(sequentialStudent.id, v, true)}
              onNoteChange={(note) => updateDraft(sequentialStudent.id, { note })}
              onPrev={() => {
                setSequentialIndex((i) => Math.max(0, i - 1));
                setNoteStudentId(null);
              }}
              onNext={() => {
                setSequentialIndex((i) => Math.min(displayStudents.length - 1, i + 1));
                setNoteStudentId(null);
              }}
              canPrev={sequentialIndex > 0}
              canNext={sequentialIndex < displayStudents.length - 1}
            />
          ) : (
            <p className="rounded-xl border bg-white p-6 text-center text-sm text-slate-500">
              Bu filtrede öğrenci bulunamadı.
            </p>
          )
        ) : viewMode === "list" ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden border-b border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400 lg:grid lg:grid-cols-[minmax(140px,1.1fr)_minmax(120px,0.8fr)_auto_auto_36px] lg:gap-3">
              <span>Öğrenci</span>
              <span>Sınıf / Grup</span>
              <span>Yoklama</span>
              <span>Okul Ödevi</span>
              <span />
            </div>
            {displayStudents.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500">Liste boş.</p>
            ) : (
              displayStudents.map((student) => (
                <DailyTrackingListRow
                  key={student.id}
                  student={student}
                  draft={drafts[student.id]}
                  hwDisabled={isHomeworkDisabled(drafts[student.id]?.attendanceStatus ?? null)}
                  noteOpen={noteStudentId === student.id}
                  unmarked={!isStudentMarked(drafts[student.id])}
                  onToggleNote={() =>
                    setNoteStudentId(noteStudentId === student.id ? null : student.id)
                  }
                  onAttendance={(v) => setAttendance(student.id, v)}
                  onHomework={(v) => setHomework(student.id, v)}
                  onNoteChange={(note) => updateDraft(student.id, { note })}
                />
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayStudents.length === 0 ? (
              <p className="rounded-xl border bg-white p-6 text-center text-sm text-slate-500">
                Liste boş.
              </p>
            ) : (
              displayStudents.map((student) => {
                const draft = drafts[student.id];
                const hwDisabled = isHomeworkDisabled(draft?.attendanceStatus ?? null);
                return (
                  <div
                    key={student.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{student.name}</p>
                        <p className="text-xs text-slate-500">
                          {student.grade} · {student.group}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setNoteStudentId(noteStudentId === student.id ? null : student.id)
                        }
                      >
                        <StickyNote size={16} className="mr-1" />
                        Not
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <AttendanceButtonGroup
                        value={draft?.attendanceStatus ?? null}
                        onChange={(v) => setAttendance(student.id, v)}
                      />
                      <HomeworkButtonGroup
                        value={draft?.homeworkStatus ?? null}
                        onChange={(v) => setHomework(student.id, v)}
                        disabled={hwDisabled}
                      />
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
        )}

        <p className="text-xs text-slate-500">
          Görünen: {displayStudents.length} · Seçili grup/kapsam: {scopeStudents.length}
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:static sm:mt-2 sm:border-0 sm:bg-transparent sm:p-0">
        <Button
          size="lg"
          className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto"
          onClick={saveAll}
        >
          <Save size={18} className="mr-2" />
          Kaydet
          {dirty ? " · Kaydedilmemiş" : ""}
        </Button>
      </div>
    </DavetLayout>
  );
}
