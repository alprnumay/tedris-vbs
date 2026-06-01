import ExcelJS from "exceljs";
import { epostaAlternatif, epostaUret, ilTahminEt, kurumKoduUret } from "./adminKullaniciUret";
import { removeDistrictPrefixFromInstitutionName } from "./normalizeTurkish";

export type ImportDurum = "yeni" | "var" | "eksik" | "mukerrer" | "email_cakisiyor";

export interface KurumImportSatiri {
  rowNumber: number;
  sira: string;
  district: string;
  institutionName: string;
  cleanInstitutionName: string;
  institutionCode: string;
  email: string;
  province: string;
  durum: ImportDurum;
  durumMetni: string;
}

export interface MevcutImportKurum {
  institutionCode?: string | null;
  institutionName?: string | null;
  districtName?: string | null;
  province?: string | null;
}

function titleCaseTr(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toLocaleUpperCase("tr-TR") + p.slice(1))
    .join(" ");
}

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object" && "text" in value) return String(value.text ?? "").trim();
  if (typeof value === "object" && "result" in value) return String(value.result ?? "").trim();
  return String(value).trim();
}

function normalizeImportKey(value?: string | null): string {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ");
}

function institutionCompositeKey(institutionName: string, districtName: string, province: string): string {
  return [institutionName, districtName, province].map(normalizeImportKey).join("|");
}

export async function excelKurumImportOku(
  file: File,
  mevcutKurumKodlari: string[],
  mevcutEpostalar: string[],
  mevcutKurumlar: MevcutImportKurum[] = [],
): Promise<KurumImportSatiri[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.getWorksheet("Güncel Talebe");
  if (!ws) throw new Error("Excel içinde 'Güncel Talebe' sayfası bulunamadı.");

  const seenCodes = new Set<string>();
  const seenEmails = new Set<string>();
  const kurumSet = new Set(mevcutKurumKodlari.map(normalizeImportKey));
  const kurumKeySet = new Set(
    mevcutKurumlar.map((k) => institutionCompositeKey(k.institutionName ?? "", k.districtName ?? "", k.province ?? "")),
  );
  const emailSet = new Set(mevcutEpostalar.map((e) => e.toLocaleLowerCase("tr-TR")));
  const rows: KurumImportSatiri[] = [];

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const sira = cellText(row.getCell(1).value);
    const district = titleCaseTr(cellText(row.getCell(2).value));
    const institutionName = titleCaseTr(cellText(row.getCell(3).value));
    const cleanInstitutionName = removeDistrictPrefixFromInstitutionName(district, institutionName);
    const institutionCode = district && institutionName ? kurumKoduUret(district, institutionName) : "";
    const province = ilTahminEt(district);
    let email = district && institutionName ? epostaUret(district, institutionName) : "";
    let durum: ImportDurum = "yeni";
    let durumMetni = "Yeni eklenecek";

    if (!district || !institutionName) {
      durum = "eksik";
      durumMetni = "Eksik bilgi";
    } else if (seenCodes.has(normalizeImportKey(institutionCode)) || seenEmails.has(email.toLocaleLowerCase("tr-TR"))) {
      durum = "mukerrer";
      durumMetni = "Dosyada mükerrer";
    } else if (kurumSet.has(normalizeImportKey(institutionCode)) || kurumKeySet.has(institutionCompositeKey(cleanInstitutionName, district, province))) {
      durum = "var";
      durumMetni = "Zaten var";
    } else if (emailSet.has(email.toLocaleLowerCase("tr-TR"))) {
      durum = "email_cakisiyor";
      email = epostaAlternatif(district, institutionName, 2);
      durumMetni = "E-posta çakışıyor";
    }

    if (institutionCode) seenCodes.add(normalizeImportKey(institutionCode));
    if (email) seenEmails.add(email.toLocaleLowerCase("tr-TR"));
    rows.push({
      rowNumber,
      sira,
      district,
      institutionName,
      cleanInstitutionName,
      institutionCode,
      email,
      province,
      durum,
      durumMetni,
    });
  });

  return rows;
}
