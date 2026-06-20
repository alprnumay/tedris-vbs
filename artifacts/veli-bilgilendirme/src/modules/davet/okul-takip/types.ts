export type AttendanceStatus = "present" | "absent" | "excused" | "late";

export type HomeworkStatus =
  | "completed"
  | "incomplete"
  | "not_done"
  | "no_homework"
  | "not_checked";

export type GeneralStatus =
  | "excellent"
  | "good"
  | "needs_followup"
  | "at_risk";

export type Student = {
  id: string;
  name: string;
  grade: string;
  institution: string;
  institutionName?: string;
  institutionId?: string | null;
  mintikaName?: string;
  needsInstitutionMapping?: boolean;
  group: string;
  parentPhone: string;
  isActive: boolean;
  /** Sunucu tarafında compat_records.user_id + data.ownerUserId ile tutulur */
  ownerUserId?: string;
};

export type DailyRecord = {
  id: string;
  studentId: string;
  date: string;
  institution: string;
  institutionName?: string;
  institutionId?: string | null;
  mintikaName?: string;
  group: string;
  attendanceStatus: AttendanceStatus | null;
  homeworkStatus: HomeworkStatus | null;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyDraft = {
  studentId: string;
  attendanceStatus: AttendanceStatus | null;
  homeworkStatus: HomeworkStatus | null;
  note: string;
};

export type WeeklyStats = {
  attendanceRate: number;
  homeworkRate: number;
  generalScore: number;
  generalStatus: GeneralStatus;
  attendanceDays: number;
  homeworkDays: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  lateCount: number;
  completedCount: number;
  incompleteCount: number;
  notDoneCount: number;
  noHomeworkCount: number;
  notCheckedCount: number;
  dailyCells: DailyCell[];
};

export type DailyCell = {
  date: string;
  dayLabel: string;
  attendanceStatus: AttendanceStatus | null;
  homeworkStatus: HomeworkStatus | null;
  color: "green" | "yellow" | "red" | "blue" | "gray" | "light-gray";
};

export type RiskReason =
  | "low_general"
  | "low_attendance"
  | "low_homework"
  | "consecutive_absent"
  | "consecutive_homework"
  | "no_records";

export type RiskStudent = {
  student: Student;
  reasons: RiskReason[];
  attendanceRate: number;
  homeworkRate: number;
  generalScore: number;
  suggestedAction: string;
};

export type KarneAnalysis = {
  generalEvaluation: string;
  strength: string;
  developmentArea: string;
  parentSuggestion: string;
  teacherNote: string;
  whatsAppMessage: string;
};

export type OkulTakipStore = {
  students: Student[];
  dailyRecords: DailyRecord[];
};

export type ViewerInstitutionOption = {
  id: string;
  institutionName: string;
  mintikaName: string;
  isPrimary: boolean;
};
