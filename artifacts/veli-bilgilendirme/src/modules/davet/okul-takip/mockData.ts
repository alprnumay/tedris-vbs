import type { DailyRecord, Student } from "@/modules/davet/okul-takip/types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const MOCK_STUDENTS: Student[] = [
  {
    id: "s1",
    name: "Ahmet Yılmaz",
    grade: "5. Sınıf",
    institution: "Merkez Nehari",
    group: "A Grubu",
    parentPhone: "0532 111 2233",
    isActive: true,
  },
  {
    id: "s2",
    name: "Mehmet Demir",
    grade: "6. Sınıf",
    institution: "Merkez Nehari",
    group: "A Grubu",
    parentPhone: "0533 222 3344",
    isActive: true,
  },
  {
    id: "s3",
    name: "Ayşe Kaya",
    grade: "5. Sınıf",
    institution: "Merkez Nehari",
    group: "B Grubu",
    parentPhone: "0534 333 4455",
    isActive: true,
  },
  {
    id: "s4",
    name: "Fatma Öztürk",
    grade: "7. Sınıf",
    institution: "Merkez Nehari",
    group: "B Grubu",
    parentPhone: "0535 444 5566",
    isActive: true,
  },
  {
    id: "s5",
    name: "Ali Çelik",
    grade: "6. Sınıf",
    institution: "Şube Nehari",
    group: "C Grubu",
    parentPhone: "0536 555 6677",
    isActive: true,
  },
  {
    id: "s6",
    name: "Zeynep Arslan",
    grade: "5. Sınıf",
    institution: "Şube Nehari",
    group: "C Grubu",
    parentPhone: "0537 666 7788",
    isActive: true,
  },
  {
    id: "s7",
    name: "Hasan Yıldız",
    grade: "8. Sınıf",
    institution: "Merkez Nehari",
    group: "A Grubu",
    parentPhone: "0538 777 8899",
    isActive: true,
  },
  {
    id: "s8",
    name: "Elif Şahin",
    grade: "6. Sınıf",
    institution: "Şube Nehari",
    group: "C Grubu",
    parentPhone: "0539 888 9900",
    isActive: true,
  },
];

function makeRecord(
  studentId: string,
  date: string,
  attendance: DailyRecord["attendanceStatus"],
  homework: DailyRecord["homeworkStatus"],
  note = "",
): DailyRecord {
  const student = MOCK_STUDENTS.find((s) => s.id === studentId)!;
  const now = new Date().toISOString();
  return {
    id: `${studentId}-${date}`,
    studentId,
    date,
    institution: student.institution,
    group: student.group,
    attendanceStatus: attendance,
    homeworkStatus: homework,
    note,
    createdAt: now,
    updatedAt: now,
  };
}

/** Son birkaç gün için örnek kayıtlar */
export const MOCK_DAILY_RECORDS: DailyRecord[] = [
  // Bugün
  makeRecord("s1", daysAgo(0), "present", "completed"),
  makeRecord("s2", daysAgo(0), "present", "incomplete"),
  makeRecord("s3", daysAgo(0), "absent", "not_checked"),
  makeRecord("s4", daysAgo(0), "present", "completed"),
  makeRecord("s5", daysAgo(0), "late", "completed"),
  makeRecord("s6", daysAgo(0), "present", "not_done"),
  makeRecord("s7", daysAgo(0), "excused", "not_checked"),
  makeRecord("s8", daysAgo(0), "present", "no_homework"),
  // Dün
  makeRecord("s1", daysAgo(1), "present", "completed"),
  makeRecord("s2", daysAgo(1), "absent", "not_checked"),
  makeRecord("s3", daysAgo(1), "present", "completed"),
  makeRecord("s4", daysAgo(1), "present", "incomplete"),
  makeRecord("s5", daysAgo(1), "absent", "not_checked"),
  makeRecord("s6", daysAgo(1), "present", "not_done"),
  makeRecord("s7", daysAgo(1), "present", "completed"),
  makeRecord("s8", daysAgo(1), "present", "completed"),
  // 2 gün önce
  makeRecord("s1", daysAgo(2), "present", "completed"),
  makeRecord("s2", daysAgo(2), "present", "not_done"),
  makeRecord("s3", daysAgo(2), "present", "incomplete"),
  makeRecord("s4", daysAgo(2), "late", "completed"),
  makeRecord("s5", daysAgo(2), "absent", "not_checked"),
  makeRecord("s6", daysAgo(2), "present", "not_done"),
  makeRecord("s7", daysAgo(2), "present", "completed"),
  makeRecord("s8", daysAgo(2), "present", "incomplete"),
  // 3 gün önce
  makeRecord("s1", daysAgo(3), "present", "completed"),
  makeRecord("s2", daysAgo(3), "absent", "not_checked"),
  makeRecord("s3", daysAgo(3), "present", "completed"),
  makeRecord("s4", daysAgo(3), "present", "completed"),
  makeRecord("s5", daysAgo(3), "present", "incomplete"),
  makeRecord("s6", daysAgo(3), "absent", "not_checked"),
  makeRecord("s7", daysAgo(3), "present", "completed"),
  makeRecord("s8", daysAgo(3), "present", "completed"),
  // 4 gün önce
  makeRecord("s1", daysAgo(4), "present", "completed"),
  makeRecord("s2", daysAgo(4), "present", "incomplete"),
  makeRecord("s3", daysAgo(4), "present", "completed"),
  makeRecord("s4", daysAgo(4), "present", "completed"),
  makeRecord("s5", daysAgo(4), "absent", "not_checked"),
  makeRecord("s6", daysAgo(4), "present", "not_done"),
  makeRecord("s7", daysAgo(4), "late", "completed"),
  makeRecord("s8", daysAgo(4), "present", "completed"),
];

export function getInstitutions(students: Student[]): string[] {
  return [...new Set(students.map((s) => s.institution))].sort();
}

export function getGroups(students: Student[], institution?: string): string[] {
  const filtered = institution
    ? students.filter((s) => s.institution === institution)
    : students;
  return [...new Set(filtered.map((s) => s.group))].sort();
}

export function getGrades(students: Student[]): string[] {
  return [...new Set(students.map((s) => s.grade))].sort();
}
