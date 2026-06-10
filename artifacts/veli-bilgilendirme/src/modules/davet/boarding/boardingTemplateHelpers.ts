import type { ProgramFlowItem } from "@/modules/davet/utils/layoutUtils";
import {
  clampLines,
  formatBoardingDate,
  formatBoardingTimeRange,
  formatChecklistForPoster,
  formatProgramFlowForPoster,
  getPosterBodyClass,
  getPosterKurumClass,
  getPosterMetaClass,
  getPosterMetaLabelClass,
  getPosterTitleClass,
  getProgramFlowClass,
  hasValue,
  truncateText,
} from "@/modules/davet/utils/layoutUtils";

export type BoardingTemplateId = "program-odakli-premium" | "davet-odakli-kurumsal" | "kayit-bilgilendirme";
export type BoardingUsagePurpose = "program" | "davet" | "kayit";

export type BoardingFormSlice = {
  kurumAdi: string;
  programBasligi: string;
  programTuru: string;
  tarih: string;
  baslangicSaati: string;
  bitisSaati: string;
  sinifSeviyesi: string;
  kontenjan: string;
  yer?: string;
  kisaAciklama: string;
  veliGuvenMesaji: string;
  iletisim?: string;
  qrLink?: string;
  kullanimAmaci: BoardingUsagePurpose;
};

export type BoardingRenderModel = {
  kurumLabel: string;
  baslikText: string;
  titleClass: string;
  bodyText: string;
  bodyClass: string;
  kurumClass: string;
  metaClass: string;
  metaLabelClass: string;
  tarihLine: string;
  saatLine: string | null;
  yerText: string | null;
  sinifText: string;
  kontenjanText: string;
  guvenText: string;
  iletisimText: string;
  flow: ReturnType<typeof formatProgramFlowForPoster>;
  flowClass: string;
  checklist: ReturnType<typeof formatChecklistForPoster>;
  hasLogo: boolean;
  hasImages: boolean;
  hasQr: boolean;
  hasContact: boolean;
  showPlace: boolean;
  showRequirements: boolean;
  showFlow: boolean;
  showNote: boolean;
};

export const USAGE_PURPOSE_OPTIONS: Array<{ id: BoardingUsagePurpose; label: string; defaultTemplate: BoardingTemplateId }> = [
  { id: "program", label: "Program Görseli", defaultTemplate: "program-odakli-premium" },
  { id: "davet", label: "Davet Afişi", defaultTemplate: "davet-odakli-kurumsal" },
  { id: "kayit", label: "Kayıt / Bilgilendirme", defaultTemplate: "kayit-bilgilendirme" },
];

export function purposeToDefaultTemplate(purpose: BoardingUsagePurpose): BoardingTemplateId {
  return USAGE_PURPOSE_OPTIONS.find((p) => p.id === purpose)?.defaultTemplate ?? "program-odakli-premium";
}

export function buildBoardingRenderModel(
  values: BoardingFormSlice,
  akis: ProgramFlowItem[],
  ihtiyaclar: string[],
  opts: { hasLogo: boolean; hasImages: boolean; hasQr: boolean },
): BoardingRenderModel {
  const baslikText = truncateText(values.programBasligi, 90);
  const bodyText = clampLines(values.kisaAciklama, 4, 260);
  const flowItems = akis.filter((a) => hasValue(a.baslik) || hasValue(a.saat));
  const flow = formatProgramFlowForPoster(flowItems);
  const checklist = formatChecklistForPoster(ihtiyaclar, 10);

  return {
    kurumLabel: truncateText(values.kurumAdi, 52),
    baslikText,
    titleClass: getPosterTitleClass(baslikText),
    bodyText,
    bodyClass: getPosterBodyClass(bodyText),
    kurumClass: getPosterKurumClass(),
    metaClass: getPosterMetaClass(),
    metaLabelClass: getPosterMetaLabelClass(),
    tarihLine: formatBoardingDate(values.tarih),
    saatLine: formatBoardingTimeRange(values.baslangicSaati, values.bitisSaati),
    yerText: hasValue(values.yer) ? truncateText(values.yer!, 80) : null,
    sinifText: truncateText(values.sinifSeviyesi, 40),
    kontenjanText: truncateText(values.kontenjan, 32),
    guvenText: truncateText(values.veliGuvenMesaji, 180),
    iletisimText: values.iletisim?.trim() ?? "",
    flow,
    flowClass: getProgramFlowClass(flow.compact),
    checklist,
    hasLogo: opts.hasLogo,
    hasImages: opts.hasImages,
    hasQr: opts.hasQr,
    hasContact: Boolean(values.iletisim?.trim()),
    showPlace: hasValue(values.yer),
    showRequirements: ihtiyaclar.length > 0,
    showFlow: flowItems.length > 0,
    showNote: hasValue(values.veliGuvenMesaji),
  };
}
