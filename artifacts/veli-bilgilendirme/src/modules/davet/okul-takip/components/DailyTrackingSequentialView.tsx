import { ChevronLeft, ChevronRight, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AttendanceButtonGroup,
  HomeworkButtonGroup,
} from "@/modules/davet/okul-takip/components/StatusButtonGroup";
import type { AttendanceStatus, DailyDraft, HomeworkStatus, Student } from "@/modules/davet/okul-takip/types";

type Props = {
  student: Student;
  draft: DailyDraft | undefined;
  hwDisabled: boolean;
  index: number;
  total: number;
  remaining: number;
  noteOpen: boolean;
  onToggleNote: () => void;
  onAttendance: (status: AttendanceStatus) => void;
  onHomework: (status: HomeworkStatus) => void;
  onNoteChange: (note: string) => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
};

export function DailyTrackingSequentialView({
  student,
  draft,
  hwDisabled,
  index,
  total,
  remaining,
  noteOpen,
  onToggleNote,
  onAttendance,
  onHomework,
  onNoteChange,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span>
          Öğrenci {index + 1} / {total}
        </span>
        <span className="font-semibold text-violet-700">Kalan: {remaining}</span>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">{student.name}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {student.grade} · {student.group} · {student.institution}
        </p>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Yoklama</p>
          <AttendanceButtonGroup
            value={draft?.attendanceStatus ?? null}
            onChange={onAttendance}
            className="justify-center"
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Okul Ödevi
            {hwDisabled ? (
              <span className="ml-2 font-normal normal-case text-slate-400">
                (Yok nedeniyle işlenmedi)
              </span>
            ) : null}
          </p>
          <HomeworkButtonGroup
            value={draft?.homeworkStatus ?? null}
            onChange={onHomework}
            disabled={hwDisabled}
            className="justify-center"
          />
        </div>

        <div className="flex justify-center">
          <Button variant="outline" onClick={onToggleNote}>
            <StickyNote size={16} className="mr-2" />
            Not {draft?.note ? "· dolu" : ""}
          </Button>
        </div>
        {noteOpen ? (
          <Textarea
            placeholder="Kısa not..."
            value={draft?.note ?? ""}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={3}
          />
        ) : null}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="outline" disabled={!canPrev} onClick={onPrev} className="min-h-11 flex-1">
          <ChevronLeft size={18} className="mr-1" />
          Önceki
        </Button>
        <Button variant="outline" disabled={!canNext} onClick={onNext} className="min-h-11 flex-1">
          Sonraki
          <ChevronRight size={18} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}
