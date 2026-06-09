import type { StudentRecord } from "@/modules/davet/types";
import {
  clampLines,
  getPosterBodyClass,
  getPosterKurumClass,
  getPosterMetaClass,
  getPosterMetaLabelClass,
  getPosterTitleClass,
  hasValue,
  truncateText,
} from "@/modules/davet/utils/layoutUtils";

export type InviteTemplateId =
  | "kurumsal-klasik"
  | "modern-bolmeli"
  | "premium-lacivert"
  | "fotografli"
  | "qr-kayit";

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

export type InviteRenderModel = {
  kurumLabel: string;
  baslikText: string;
  titleClass: string;
  bodyText: string;
  bodyClass: string;
  kurumClass: string;
  metaClass: string;
  metaLabelClass: string;
  tarihLine: string | null;
  saatLine: string | null;
  yerText: string | null;
  showYer: boolean;
  showTarih: boolean;
  showSaat: boolean;
  katilimText: string;
  iletisimTelefon: string;
  showKatilim: boolean;
  showIletisim: boolean;
  hasQr: boolean;
  hasLogo: boolean;
  hasPhoto: boolean;
  selectedStudent: StudentRecord | null;
  metaBlocks: Array<{ key: string; label: string; value: string }>;
};

export function formatInviteDateDisplay(tarih: string): string | null {
  if (!hasValue(tarih)) return null;
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
  const raw = saat.trim();
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;
  return raw;
}

export function fitTitleText(text: string): { text: string; className: string } {
  const t = truncateText(text, 90);
  return { text: t, className: getPosterTitleClass(t) };
}

export function fitBodyText(text: string, maxLines = 4, maxChars = 280): { text: string; className: string } {
  const t = clampLines(text, maxLines, maxChars);
  return { text: t, className: getPosterBodyClass(t) };
}

export function resolveOptionalBlocks(
  model: InviteRenderModel,
  excludeKeys: string[] = [],
): InviteRenderModel["metaBlocks"] {
  if (excludeKeys.length === 0) return model.metaBlocks;
  return model.metaBlocks.filter((block) => !excludeKeys.includes(block.key));
}

export function resolveLogoPlacement(hasLogo: boolean) {
  return {
    showLogo: hasLogo,
    logoClass: "h-[72px] max-h-[88px] w-auto max-w-[220px] object-contain object-left",
    logoClassCompact: "h-[56px] max-h-[64px] w-auto max-w-[180px] object-contain",
    logoFrameClass: "rounded-xl bg-white/95 p-2 ring-1 ring-black/5 shadow-sm",
  };
}

export function buildInviteRenderModel(
  values: InviteFormSlice,
  aciklama: string,
  selectedStudent: StudentRecord | null,
  opts: { hasLogo: boolean; hasPhoto: boolean; hasQr: boolean },
): InviteRenderModel {
  const title = fitTitleText(values.davetBasligi);
  const body = fitBodyText(aciklama);
  const tarihLine = formatInviteDateDisplay(values.tarih);
  const saatLine = formatInviteTimeDisplay(values.saat);
  const yerText = hasValue(values.yer) ? truncateText(values.yer, 80) : null;
  const katilimText = hasValue(values.katilimNotu) ? truncateText(values.katilimNotu!, 120) : "";
  const iletisimTelefon = values.iletisimTelefon?.trim() ?? "";

  const metaBlocks: InviteRenderModel["metaBlocks"] = [];
  if (tarihLine) metaBlocks.push({ key: "tarih", label: "Tarih", value: tarihLine });
  if (saatLine) metaBlocks.push({ key: "saat", label: "Saat", value: saatLine });
  if (yerText) metaBlocks.push({ key: "yer", label: "Yer", value: yerText });

  return {
    kurumLabel: truncateText(values.kurumAdi, 48),
    baslikText: title.text,
    titleClass: title.className,
    bodyText: body.text,
    bodyClass: body.className,
    kurumClass: getPosterKurumClass(),
    metaClass: getPosterMetaClass(),
    metaLabelClass: getPosterMetaLabelClass(),
    tarihLine,
    saatLine,
    yerText,
    showYer: Boolean(yerText),
    showTarih: Boolean(tarihLine),
    showSaat: Boolean(saatLine),
    katilimText,
    iletisimTelefon,
    showKatilim: Boolean(katilimText),
    showIletisim: Boolean(iletisimTelefon),
    hasQr: opts.hasQr,
    hasLogo: opts.hasLogo,
    hasPhoto: opts.hasPhoto,
    selectedStudent,
    metaBlocks,
  };
}
