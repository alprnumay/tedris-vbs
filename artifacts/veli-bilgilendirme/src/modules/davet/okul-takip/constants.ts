import type {
  AttendanceStatus,
  GeneralStatus,
  HomeworkStatus,
} from "@/modules/davet/okul-takip/types";

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: "Var",
  absent: "Yok",
  excused: "Mazeretli",
  late: "Geç Geldi",
};

export const ATTENDANCE_ICONS: Record<AttendanceStatus, string> = {
  present: "✅",
  absent: "❌",
  excused: "⭕",
  late: "⏰",
};

export const HOMEWORK_LABELS: Record<HomeworkStatus, string> = {
  completed: "Tamam",
  incomplete: "Eksik",
  not_done: "Yapmadı",
  no_homework: "Ödev Yok",
  not_checked: "Kontrol edilmedi",
};

export const HOMEWORK_ICONS: Record<HomeworkStatus, string> = {
  completed: "✅",
  incomplete: "⚠️",
  not_done: "❌",
  no_homework: "➖",
  not_checked: "❔",
};

export const GENERAL_STATUS_LABELS: Record<GeneralStatus, string> = {
  excellent: "Çok iyi",
  good: "İyi",
  needs_followup: "Takip edilmeli",
  at_risk: "Yakın takip gerekli",
};

export const GENERAL_STATUS_COLORS: Record<
  GeneralStatus,
  { bg: string; text: string; border: string }
> = {
  excellent: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
  },
  good: {
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-200",
  },
  needs_followup: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  at_risk: {
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
  },
};

export const ATTENDANCE_POINTS: Record<AttendanceStatus, number | null> = {
  present: 100,
  late: 75,
  absent: 0,
  excused: null,
};

export const HOMEWORK_POINTS: Record<HomeworkStatus, number | null> = {
  completed: 100,
  incomplete: 50,
  not_done: 0,
  no_homework: null,
  not_checked: null,
};

export const WEEKDAY_LABELS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"];

export const STORAGE_KEY = "nehari-okul-takip-v1";

export const OKUL_TAKIP_MODULE_TITLE = "Yurt Ödev ve Yoklama Takibi";
export const OKUL_TAKIP_HOME_BACK_LABEL = `${OKUL_TAKIP_MODULE_TITLE} Ana Sayfası`;
export const OKUL_TAKIP_INSTITUTION_HINT =
  "Öğrenci, hesabınıza bağlı yurda kaydedilecektir.";

export const RISK_ACTIONS: Record<string, string> = {
  low_general: "Hoca efendi birebir ilgilenecek",
  low_attendance: "Veli aranacak",
  low_homework: "Okul ödevi kontrolü için veli desteği istenecek",
  consecutive_absent: "Ev ziyareti planlanacak",
  consecutive_homework: "Etüt/ödev saati desteği verilecek",
  no_records: "Hoca efendi birebir ilgilenecek",
};
