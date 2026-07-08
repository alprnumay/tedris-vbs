import * as XLSX from "xlsx";
import type { Student, ViewerInstitutionOption } from "@/modules/davet/okul-takip/types";

export type ImportRowStatus =
  | "addable"
  | "existing"
  | "left"
  | "institution_mismatch"
  | "mintika_mismatch"
  | "error";

export type ImportFinalStatus = ImportRowStatus | "added" | "failed";

export type StudentImportRow = {
  rowNumber: number;
  name: string;
  grade: string;
  group: string;
  institutionName: string;
  mintikaName: string;
  parentPhone: string;
  studentCode: string;
  nationalId: string;
  status: ImportFinalStatus;
  message: string;
  targetInstitutionId: string | null;
  targetInstitutionName: string;
  targetMintikaName: string;
  rawImportData: Record<string, string>;
};

export type StudentImportSummary = {
  totalRows: number;
  addable: number;
  existing: number;
  left: number;
  institutionMismatch: number;
  mintikaMismatch: number;
  error: number;
  added: number;
  failed: number;
};

export type StudentImportPreview = {
  rows: StudentImportRow[];
  summary: StudentImportSummary;
};

type CellRow = unknown[];

const MAX_XLSX_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMPORT_ROWS = 1000;

const COL = {
  studentProfile: 0,
  studentCode: 1,
  institutionCode: 2,
  nationalId: 3,
  region: 4,
  mintika: 5,
  institution: 6,
  firstName: 7,
  lastName: 8,
  preferredName: 9,
  studentType: 10,
  gender: 11,
  nevi: 12,
  status: 13,
  registrationDate: 14,
  studentStartDate: 15,
  internalLevel: 16,
  schoolLevel: 17,
  internalResponsibleCode: 18,
  internalResponsibleName: 19,
  studyResponsibleCode: 20,
  studyResponsibleName: 21,
  phone: 24,
  parentContact: 25,
  birthDate: 26,
  middleSchoolName: 34,
  middleSchoolType: 35,
  leftDate: 36,
  leftType: 37,
  leftReasons: 38,
} as const;

function cellText(row: CellRow, index: number): string {
  const value = row[index];
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

export function normalizeImportText(value?: string | null): string {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");
}

function normalizeCompact(value?: string | null): string {
  return normalizeImportText(value).replace(/\s+/g, "");
}

function normalizeIdentity(value?: string | null): string {
  return (value ?? "").replace(/\D/g, "");
}

function extractGrade(value: string): string {
  const match = value.match(/\b([1-9]|1[0-2])\b/);
  return match?.[1] ?? "";
}

function normalizePhone(value: string): string {
  const compact = value.replace(/[^\d+]/g, "");
  const matches = compact.match(/(?:\+?90|0)?5\d{9}/g);
  const first = matches?.[0] ?? "";
  if (!first) return "";
  const digits = first.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("90")) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+90${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("5")) return `+90${digits}`;
  return "";
}

function statusLabel(status: ImportFinalStatus): string {
  switch (status) {
    case "addable":
      return "Eklenecek";
    case "added":
      return "Eklendi";
    case "existing":
      return "Zaten vardı";
    case "left":
      return "Atlandı - Ayrıldı";
    case "institution_mismatch":
      return "Atlandı - Kurum uyuşmuyor";
    case "mintika_mismatch":
      return "Atlandı - Mıntıka uyuşmuyor";
    case "failed":
      return "Hata - Format okunamadı";
    case "error":
    default:
      return "Hata - Format okunamadı";
  }
}

function institutionMatches(excelName: string, option: ViewerInstitutionOption): boolean {
  if (!excelName.trim()) return true;
  return normalizeCompact(excelName) === normalizeCompact(option.institutionName);
}

function mintikaMatches(excelMintika: string, option: ViewerInstitutionOption): boolean {
  if (!excelMintika.trim()) return true;
  return normalizeCompact(excelMintika) === normalizeCompact(option.mintikaName);
}

function resolveTargetInstitution(
  excelInstitution: string,
  excelMintika: string,
  institutions: ViewerInstitutionOption[],
  selectedInstitutionId?: string | null,
): { option: ViewerInstitutionOption | null; status?: ImportRowStatus } {
  const selected =
    institutions.find((item) => item.id === selectedInstitutionId) ??
    (institutions.length === 1 ? institutions[0] : null);

  if (selected) {
    if (excelMintika.trim() && !mintikaMatches(excelMintika, selected)) {
      return { option: null, status: "mintika_mismatch" };
    }
    if (excelInstitution.trim() && !institutionMatches(excelInstitution, selected)) {
      return { option: null, status: "institution_mismatch" };
    }
    return { option: selected };
  }

  const mintikaCandidates = excelMintika.trim()
    ? institutions.filter((item) => mintikaMatches(excelMintika, item))
    : institutions;

  if (excelMintika.trim() && mintikaCandidates.length === 0) {
    return { option: null, status: "mintika_mismatch" };
  }

  const institutionCandidates = excelInstitution.trim()
    ? mintikaCandidates.filter((item) => institutionMatches(excelInstitution, item))
    : mintikaCandidates;

  if (excelInstitution.trim() && institutionCandidates.length === 0) {
    return { option: null, status: "institution_mismatch" };
  }

  return { option: institutionCandidates[0] ?? null };
}

function duplicateKeysFor(row: Pick<StudentImportRow, "nationalId" | "studentCode" | "name" | "grade" | "targetInstitutionId" | "targetInstitutionName">): string[] {
  const institutionKey = row.targetInstitutionId || normalizeImportText(row.targetInstitutionName);
  const keys: string[] = [];
  const nationalId = normalizeIdentity(row.nationalId);
  const studentCode = normalizeImportText(row.studentCode);
  if (nationalId) keys.push(`id:${institutionKey}:${nationalId}`);
  if (studentCode) keys.push(`code:${institutionKey}:${studentCode}`);
  keys.push(`name:${institutionKey}:${normalizeImportText(row.name)}:${normalizeImportText(row.grade)}`);
  return keys;
}

function existingDuplicateKeys(students: Student[]): Set<string> {
  const keys = new Set<string>();
  for (const student of students) {
    const row = {
      nationalId: student.nationalId ?? "",
      studentCode: student.studentCode ?? "",
      name: student.name,
      grade: student.grade,
      targetInstitutionId: student.institutionId ?? null,
      targetInstitutionName: student.institutionName ?? student.institution,
    };
    duplicateKeysFor(row).forEach((key) => keys.add(key));
  }
  return keys;
}

function buildSummary(rows: StudentImportRow[]): StudentImportSummary {
  return rows.reduce<StudentImportSummary>(
    (acc, row) => {
      acc.totalRows += 1;
      if (row.status === "addable") acc.addable += 1;
      if (row.status === "added") acc.added += 1;
      if (row.status === "existing") acc.existing += 1;
      if (row.status === "left") acc.left += 1;
      if (row.status === "institution_mismatch") acc.institutionMismatch += 1;
      if (row.status === "mintika_mismatch") acc.mintikaMismatch += 1;
      if (row.status === "error") acc.error += 1;
      if (row.status === "failed") acc.failed += 1;
      return acc;
    },
    {
      totalRows: 0,
      addable: 0,
      existing: 0,
      left: 0,
      institutionMismatch: 0,
      mintikaMismatch: 0,
      error: 0,
      added: 0,
      failed: 0,
    },
  );
}

function rawDataFromRow(row: CellRow): Record<string, string> {
  return {
    talebeProfili: cellText(row, COL.studentProfile),
    talebeKodu: cellText(row, COL.studentCode),
    kurumKodu: cellText(row, COL.institutionCode),
    kimlikNo: cellText(row, COL.nationalId),
    bolge: cellText(row, COL.region),
    mintika: cellText(row, COL.mintika),
    kurum: cellText(row, COL.institution),
    adi: cellText(row, COL.firstName),
    soyadi: cellText(row, COL.lastName),
    kullanilanAdiSoyadi: cellText(row, COL.preferredName),
    talebeTuru: cellText(row, COL.studentType),
    cinsiyet: cellText(row, COL.gender),
    nevi: cellText(row, COL.nevi),
    durumu: cellText(row, COL.status),
    kayitTarihi: cellText(row, COL.registrationDate),
    sonTalebelikBaslangicTarihi: cellText(row, COL.studentStartDate),
    dahiliSeviye: cellText(row, COL.internalLevel),
    okulSeviyesi: cellText(row, COL.schoolLevel),
    dahiliMesulKodu: cellText(row, COL.internalResponsibleCode),
    dahiliMesulAdiSoyadi: cellText(row, COL.internalResponsibleName),
    etutMesuluKodu: cellText(row, COL.studyResponsibleCode),
    etutMesulu: cellText(row, COL.studyResponsibleName),
    telefonNumarasi: cellText(row, COL.phone),
    veliIletisimBilgileri: cellText(row, COL.parentContact),
    dogumTarihi: cellText(row, COL.birthDate),
    ortaokulAdi: cellText(row, COL.middleSchoolName),
    ortaokulTuru: cellText(row, COL.middleSchoolType),
    ayrilmaTarihi: cellText(row, COL.leftDate),
    ayrilmaSekli: cellText(row, COL.leftType),
    ayrilmaSebepleri: cellText(row, COL.leftReasons),
  };
}

export async function buildStudentImportPreview(params: {
  file: File;
  existingStudents: Student[];
  institutions: ViewerInstitutionOption[];
  selectedInstitutionId?: string | null;
}): Promise<StudentImportPreview> {
  const { file, existingStudents, institutions, selectedInstitutionId } = params;
  if (!file.name.toLocaleLowerCase("tr-TR").endsWith(".xlsx")) {
    throw new Error("Sadece .xlsx formatında Excel dosyası yükleyin.");
  }
  if (file.size > MAX_XLSX_SIZE_BYTES) {
    throw new Error("Excel dosyası çok büyük. Lütfen daha küçük bir .xlsx dosyası yükleyin.");
  }

  let sheetRows: CellRow[];
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const sheetName = workbook.SheetNames.includes("Sorgu sonucu")
      ? "Sorgu sonucu"
      : workbook.SheetNames[0];
    const sheet = sheetName ? workbook.Sheets[sheetName] : null;
    if (!sheet) throw new Error("sheet missing");
    sheetRows = XLSX.utils.sheet_to_json<CellRow>(sheet, {
      header: 1,
      raw: false,
      blankrows: false,
    });
  } catch {
    throw new Error("Excel dosyası okunamadı. Lütfen doğru formatta .xlsx dosyası yükleyin.");
  }

  const dataRows = sheetRows.slice(1, MAX_IMPORT_ROWS + 1);
  const seenKeys = existingDuplicateKeys(existingStudents);
  const rows: StudentImportRow[] = [];

  dataRows.forEach((excelRow, idx) => {
    const rowNumber = idx + 2;
    const rawImportData = rawDataFromRow(excelRow);
    const preferredName = rawImportData.kullanilanAdiSoyadi;
    const name = (preferredName || `${rawImportData.adi} ${rawImportData.soyadi}`).replace(/\s+/g, " ").trim();
    const grade = extractGrade(rawImportData.okulSeviyesi);
    const parentPhone = normalizePhone(rawImportData.veliIletisimBilgileri) || normalizePhone(rawImportData.telefonNumarasi);
    const excelInstitution = rawImportData.kurum;
    const excelMintika = rawImportData.mintika;
    const left = normalizeImportText(rawImportData.durumu) === "ayrildi" || Boolean(rawImportData.ayrilmaTarihi.trim());
    const target = resolveTargetInstitution(excelInstitution, excelMintika, institutions, selectedInstitutionId);
    const baseRow: StudentImportRow = {
      rowNumber,
      name,
      grade,
      group: "",
      institutionName: excelInstitution,
      mintikaName: excelMintika,
      parentPhone,
      studentCode: rawImportData.talebeKodu,
      nationalId: normalizeIdentity(rawImportData.kimlikNo),
      status: "addable",
      message: "Eklenecek",
      targetInstitutionId: target.option?.id ?? null,
      targetInstitutionName: target.option?.institutionName ?? "",
      targetMintikaName: target.option?.mintikaName ?? "",
      rawImportData,
    };

    if (!name) {
      rows.push({ ...baseRow, status: "error", message: "Hata - Ad soyad boş" });
      return;
    }
    if (left) {
      rows.push({ ...baseRow, status: "left", message: statusLabel("left") });
      return;
    }
    if (target.status) {
      rows.push({ ...baseRow, status: target.status, message: statusLabel(target.status) });
      return;
    }
    if (!target.option) {
      rows.push({ ...baseRow, status: "institution_mismatch", message: statusLabel("institution_mismatch") });
      return;
    }

    const duplicateKeys = duplicateKeysFor(baseRow);
    if (duplicateKeys.some((key) => seenKeys.has(key))) {
      rows.push({ ...baseRow, status: "existing", message: statusLabel("existing") });
      return;
    }
    duplicateKeys.forEach((key) => seenKeys.add(key));
    rows.push(baseRow);
  });

  return { rows, summary: buildSummary(rows) };
}

export function recalculateStudentImportSummary(rows: StudentImportRow[]): StudentImportSummary {
  return buildSummary(rows);
}

export function importStatusLabel(status: ImportFinalStatus): string {
  return statusLabel(status);
}
