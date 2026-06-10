import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Save, StickyNote } from "lucide-react";
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
import {
  AttendanceButtonGroup,
  HomeworkButtonGroup,
} from "@/modules/davet/okul-takip/components/StatusButtonGroup";
import { StatCard } from "@/modules/davet/okul-takip/components/StatCard";
import {
  applyAbsentHomework,
  applyHomeworkToAttendance,
  computeDailySummary,
  isHomeworkDisabled,
} from "@/modules/davet/okul-takip/calculations";
import { getGroups, getInstitutions } from "@/modules/davet/okul-takip/mockData";
import type { AttendanceStatus, DailyDraft, DailyRecord, HomeworkStatus } from "@/modules/davet/okul-takip/types";
import { OKUL_TAKIP_HOME } from "@/modules/davet/okul-takip/routes";
import {
  generateId,
  getRecordForStudentDate,
  todayIso,
  upsertDailyRecords,
  useOkulTakipStore,
} from "@/modules/davet/okul-takip/store";

export default function DailyTrackingPage() {
  const { students, dailyRecords } = useOkulTakipStore();
  const [date, setDate] = useState(todayIso());
  const [institution, setInstitution] = useState<string>("all");
  const [group, setGroup] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, DailyDraft>>({});
  const [dirty, setDirty] = useState(false);
  const [noteStudentId, setNoteStudentId] = useState<string | null>(null);

  const institutions = useMemo(() => getInstitutions(students), [students]);
  const groups = useMemo(
    () => getGroups(students, institution === "all" ? undefined : institution),
    [students, institution],
  );

  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => s.isActive)
      .filter((s) => institution === "all" || s.institution === institution)
      .filter((s) => group === "all" || s.group === group)
      .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()));
  }, [students, institution, group, search]);

  const initDrafts = useCallback(() => {
    const next: Record<string, DailyDraft> = {};
    for (const s of filteredStudents) {
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
  }, [filteredStudents, dailyRecords, date]);

  useEffect(() => {
    initDrafts();
  }, [initDrafts]);

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

  const updateDraft = (studentId: string, patch: Partial<DailyDraft>) => {
    setDrafts((prev) => {
      const current = prev[studentId] ?? {
        studentId,
        attendanceStatus: null,
        homeworkStatus: null,
        note: "",
      };
      return { ...prev, [studentId]: { ...current, ...patch } };
    });
    setDirty(true);
  };

  const setAttendance = (studentId: string, status: AttendanceStatus) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    if (status === "absent") {
      updateDraft(studentId, {
        attendanceStatus: status,
        homeworkStatus: applyAbsentHomework(),
      });
    } else {
      updateDraft(studentId, { attendanceStatus: status });
    }
  };

  const setHomework = (studentId: string, status: HomeworkStatus) => {
    const draft = drafts[studentId];
    if (draft && isHomeworkDisabled(draft.attendanceStatus)) return;

    updateDraft(studentId, {
      homeworkStatus: status,
      attendanceStatus: applyHomeworkToAttendance(),
    });
  };

  const saveAll = () => {
    const records: DailyRecord[] = filteredStudents.map((s) => {
      const d = drafts[s.id];
      const existing = getRecordForStudentDate(dailyRecords, s.id, date);
      return {
        id: existing?.id ?? generateId("dr"),
        studentId: s.id,
        date,
        institution: s.institution,
        group: s.group,
        attendanceStatus: d?.attendanceStatus ?? null,
        homeworkStatus: d?.homeworkStatus ?? null,
        note: d?.note ?? "",
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
    upsertDailyRecords(records);
    setDirty(false);
    toast.success("Günlük takip kaydedildi.");
  };

  const bulkPresent = () => {
    for (const s of filteredStudents) {
      updateDraft(s.id, { attendanceStatus: "present" });
    }
  };

  const bulkHomeworkComplete = () => {
    for (const s of filteredStudents) {
      const d = drafts[s.id];
      if (d?.attendanceStatus !== "absent") {
        updateDraft(s.id, {
          homeworkStatus: "completed",
          attendanceStatus: "present",
        });
      }
    }
  };

  const bulkNotChecked = () => {
    for (const s of filteredStudents) {
      if (drafts[s.id]?.attendanceStatus !== "absent") {
        updateDraft(s.id, {
          homeworkStatus: "not_checked",
          attendanceStatus: drafts[s.id]?.attendanceStatus ?? "present",
        });
      }
    }
  };

  const clearAll = () => {
    for (const s of filteredStudents) {
      updateDraft(s.id, {
        attendanceStatus: null,
        homeworkStatus: null,
        note: "",
      });
    }
  };

  const draftRecords: DailyRecord[] = filteredStudents.map((s) => {
    const d = drafts[s.id];
    return {
      id: s.id,
      studentId: s.id,
      date,
      institution: s.institution,
      group: s.group,
      attendanceStatus: d?.attendanceStatus ?? null,
      homeworkStatus: d?.homeworkStatus ?? null,
      note: "",
      createdAt: "",
      updatedAt: "",
    };
  });
  const summary = computeDailySummary(
    draftRecords,
    filteredStudents.map((s) => s.id),
  );

  return (
    <DavetLayout>
      <div className="space-y-5 pb-24">
        <BackButton label="Okul Takip Ana Sayfası" href={OKUL_TAKIP_HOME} />

        <div>
          <h1 className="text-xl font-bold text-slate-900">Günlük Takip</h1>
          <p className="text-sm text-slate-600">Yoklama ve okul ödevi aynı satırda.</p>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Grup</label>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Grup" />
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
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Arama</label>
            <Input
              placeholder="Öğrenci adı..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          <StatCard label="Toplam" value={summary.total} className="p-3" />
          <StatCard label="Var" value={summary.present} tone="green" className="p-3" />
          <StatCard label="Yok" value={summary.absent} tone="red" className="p-3" />
          <StatCard label="Mazeret" value={summary.excused} tone="blue" className="p-3" />
          <StatCard label="Geç" value={summary.late} tone="amber" className="p-3" />
          <StatCard label="Tamam" value={summary.hwCompleted} tone="green" className="p-3" />
          <StatCard label="Eksik" value={summary.hwIncomplete} tone="amber" className="p-3" />
          <StatCard label="Yapmamış" value={summary.hwNotDone} tone="red" className="p-3" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={bulkPresent}>
            Hepsini Var
          </Button>
          <Button variant="outline" size="sm" onClick={bulkHomeworkComplete}>
            Hepsini Ödev Tamam
          </Button>
          <Button variant="outline" size="sm" onClick={bulkPresent}>
            Seçili grubu Var
          </Button>
          <Button variant="outline" size="sm" onClick={bulkNotChecked}>
            Seçili grubu Kontrol Edilmedi
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Tümünü temizle
          </Button>
        </div>

        <div className="space-y-4">
          {filteredStudents.map((student) => {
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
                      {student.grade} · {student.institution} · {student.group}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600"
                    onClick={() =>
                      setNoteStudentId(noteStudentId === student.id ? null : student.id)
                    }
                  >
                    <StickyNote size={16} className="mr-1" />
                    Not
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-500">Yoklama</p>
                    <AttendanceButtonGroup
                      value={draft?.attendanceStatus ?? null}
                      onChange={(v) => setAttendance(student.id, v)}
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-500">
                      Okul Ödevi
                      {hwDisabled ? (
                        <span className="ml-2 font-normal text-slate-400">
                          (Yok nedeniyle işlenmedi)
                        </span>
                      ) : null}
                    </p>
                    <HomeworkButtonGroup
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
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0">
        <Button
          size="lg"
          className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto"
          onClick={saveAll}
        >
          <Save size={18} className="mr-2" />
          Kaydet
          {dirty ? " · Kaydedilmemiş değişiklikler" : ""}
        </Button>
      </div>
    </DavetLayout>
  );
}
