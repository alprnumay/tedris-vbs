import { StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
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
  noteOpen: boolean;
  onToggleNote: () => void;
  onAttendance: (status: AttendanceStatus) => void;
  onHomework: (status: HomeworkStatus) => void;
  onNoteChange: (note: string) => void;
  unmarked?: boolean;
};

export function DailyTrackingListRow({
  student,
  draft,
  hwDisabled,
  noteOpen,
  onToggleNote,
  onAttendance,
  onHomework,
  onNoteChange,
  unmarked,
}: Props) {
  return (
    <div
      className={cn(
        "border-b border-slate-100 bg-white px-2 py-2 last:border-b-0 sm:px-3 sm:py-2.5",
        unmarked && "bg-amber-50/40",
      )}
    >
      {/* Desktop: single row layout */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(140px,1.1fr)_minmax(120px,0.8fr)_auto_auto_36px] lg:items-center lg:gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{student.name}</p>
        </div>
        <p className="truncate text-xs text-slate-500">
          {student.grade} / {student.group}
        </p>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Yoklama</p>
          <AttendanceButtonGroup
            compact
            showIcons={false}
            value={draft?.attendanceStatus ?? null}
            onChange={onAttendance}
          />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Ödev{hwDisabled ? " · pasif" : ""}
          </p>
          <HomeworkButtonGroup
            compact
            showIcons={false}
            value={draft?.homeworkStatus ?? null}
            onChange={onHomework}
            disabled={hwDisabled}
          />
        </div>
        <Button
          type="button"
          variant={noteOpen || draft?.note ? "secondary" : "ghost"}
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={onToggleNote}
          title="Not"
        >
          <StickyNote size={16} />
        </Button>
      </div>

      {/* Mobile / tablet: stacked compact */}
      <div className="space-y-2 lg:hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{student.name}</p>
            <p className="text-xs text-slate-500">
              {student.grade} · {student.group}
            </p>
          </div>
          <Button
            type="button"
            variant={noteOpen || draft?.note ? "secondary" : "outline"}
            size="sm"
            className="h-9 shrink-0 px-2"
            onClick={onToggleNote}
          >
            <StickyNote size={14} className="mr-1" />
            Not
          </Button>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold text-slate-500">Yoklama</p>
          <AttendanceButtonGroup
            compact
            value={draft?.attendanceStatus ?? null}
            onChange={onAttendance}
          />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold text-slate-500">
            Ödev
            {hwDisabled ? (
              <span className="ml-1 font-normal text-slate-400">(Yok nedeniyle işlenmedi)</span>
            ) : null}
          </p>
          <HomeworkButtonGroup
            compact
            value={draft?.homeworkStatus ?? null}
            onChange={onHomework}
            disabled={hwDisabled}
          />
        </div>
      </div>

      {noteOpen ? (
        <Textarea
          className="mt-2 text-sm"
          placeholder="Kısa not..."
          value={draft?.note ?? ""}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={2}
        />
      ) : null}
    </div>
  );
}
