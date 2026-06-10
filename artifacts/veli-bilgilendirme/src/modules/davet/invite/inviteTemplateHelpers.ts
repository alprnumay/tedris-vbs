import type { StudentRecord } from "@/modules/davet/types";
import {
  clampLines,
  hasValue,
  TARIH_LATER,
  truncateText,
} from "@/modules/davet/utils/layoutUtils";

export type InviteTemplateId = "kurumsal-davet" | "premium-lacivert" | "gorselli-davet";

export type InviteFormSlice = {
  kurumAdi: string;
  davetBasligi: string;
  tarih: string;
  saat: string;
  yer: string;
  kisaAciklama: string;
  katilimNotu?: string;
  iletisimTelefon?: string;
  qrLink?: string;
};

export type InviteFieldKey =
  | "logo"
  | "institution"
  | "title"
  | "description"
  | "student"
  | "date"
  | "time"
  | "place"
  | "note"
  | "contact"
  | "qr"
  | "image";

export type InviteInfoField = {
  key: InviteFieldKey;
  label: string;
  value: string;
};

export type InviteRenderModel = {
  kurumLabel: string;
  baslikText: string;
  titleClass: string;
  bodyText: string;
  bodyClass: string;
  tarihLine: string;
  saatLine: string | null;
  yerText: string | null;
  katilimText: string;
  iletisimTelefon: string;
  hasLogo: boolean;
  hasImage: boolean;
  hasQr: boolean;
  selectedStudent: StudentRecord | null;
  infoFields: InviteInfoField[];
  zones: Record<InviteFieldKey, boolean>;
};

export function getTextSizeByLength(
  length: number,
  tiers: Array<{ max: number; className: string }>,
  fallback: string,
): string {
  for (const tier of tiers) {
    if (length <= tier.max) return tier.className;
  }
  return fallback;
}

export function getTitleClass(text: string): string {
  const len = text.trim().length;
  return getTextSizeByLength(
    len,
    [
      { max: 28, className: "text-[62px] leading-[1.04] tracking-tight" },
      { max: 45, className: "text-[52px] leading-[1.06] tracking-tight" },
      { max: 70, className: "text-[44px] leading-[1.1] tracking-tight" },
    ],
    "text-[38px] leading-[1.12] tracking-tight line-clamp-2",
  );
}

export function getBodyClass(text: string): string {
  const len = text.trim().length;
  return getTextSizeByLength(
    len,
    [
      { max: 100, className: "text-[26px] leading-[1.45]" },
      { max: 180, className: "text-[23px] leading-[1.45]" },
      { max: 260, className: "text-[21px] leading-[1.42]" },
    ],
    "text-[19px] leading-[1.4] line-clamp-4",
  );
}

export function getInstitutionClass(): string {
  return "text-[18px] font-bold uppercase tracking-[0.2em]";
}

export function getMetaLabelClass(): string {
  return "text-[11px] font-bold uppercase tracking-[0.22em]";
}

export function getMetaValueClass(value: string): string {
  const len = value.length;
  if (len <= 24) return "text-[26px] font-semibold leading-tight";
  if (len <= 48) return "text-[22px] font-semibold leading-snug line-clamp-2";
  return "text-[19px] font-semibold leading-snug line-clamp-2";
}

export function formatInviteDateDisplay(tarih: string): string {
  if (!hasValue(tarih)) return TARIH_LATER;
  const raw = tarih.trim();
  const d = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatInviteTimeDisplay(saat: string): string | null {
  if (!hasValue(saat)) return null;
  return saat.trim();
}

export function fitTitleText(text: string): { text: string; className: string } {
  const t = truncateText(text, 90);
  return { text: t, className: getTitleClass(t) };
}

export function fitBodyText(text: string, maxLines = 4, maxChars = 300): { text: string; className: string } {
  const t = clampLines(text, maxLines, maxChars);
  return { text: t, className: getBodyClass(t) };
}

export function resolveOptionalFields(model: Pick<
  InviteRenderModel,
  "tarihLine" | "saatLine" | "yerText" | "katilimText" | "iletisimTelefon" | "hasQr"
>): InviteInfoField[] {
  const fields: InviteInfoField[] = [];
  fields.push({ key: "date", label: "Tarih", value: model.tarihLine });
  if (model.saatLine) fields.push({ key: "time", label: "Saat", value: model.saatLine });
  if (model.yerText) fields.push({ key: "place", label: "Yer", value: model.yerText });
  if (model.katilimText) fields.push({ key: "note", label: "Not", value: model.katilimText });
  if (model.iletisimTelefon) fields.push({ key: "contact", label: "İletişim", value: model.iletisimTelefon });
  return fields;
}

export function buildInviteRenderModel(
  values: InviteFormSlice,
  aciklama: string,
  selectedStudent: StudentRecord | null,
  opts: { hasLogo: boolean; hasImage: boolean; hasQr: boolean },
): InviteRenderModel {
  const title = fitTitleText(values.davetBasligi);
  const body = fitBodyText(aciklama);
  const tarihLine = formatInviteDateDisplay(values.tarih);
  const saatLine = formatInviteTimeDisplay(values.saat);
  const yerText = hasValue(values.yer) ? truncateText(values.yer, 80) : null;
  const katilimText = hasValue(values.katilimNotu) ? truncateText(values.katilimNotu!, 120) : "";
  const iletisimTelefon = values.iletisimTelefon?.trim() ?? "";

  const partial = { tarihLine, saatLine, yerText, katilimText, iletisimTelefon, hasQr: opts.hasQr };
  const infoFields = resolveOptionalFields(partial);

  const zones: InviteRenderModel["zones"] = {
    logo: opts.hasLogo,
    institution: true,
    title: true,
    description: Boolean(body.text),
    student: Boolean(selectedStudent),
    date: true,
    time: Boolean(saatLine),
    place: Boolean(yerText),
    note: Boolean(katilimText),
    contact: Boolean(iletisimTelefon),
    qr: opts.hasQr,
    image: opts.hasImage,
  };

  return {
    kurumLabel: truncateText(values.kurumAdi, 52),
    baslikText: title.text,
    titleClass: title.className,
    bodyText: body.text,
    bodyClass: body.className,
    tarihLine,
    saatLine,
    yerText,
    katilimText,
    iletisimTelefon,
    hasLogo: opts.hasLogo,
    hasImage: opts.hasImage,
    hasQr: opts.hasQr,
    selectedStudent,
    infoFields,
    zones,
  };
}

export const LOGO_MAX = {
  width: 200,
  height: 72,
  compactHeight: 56,
};
