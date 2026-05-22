import type { LogoGrupEtiketi, LogoKategori, LogoTemplateId } from "@/types/logoKimlik";

export const LOGO_TEMPLATE_SIRASI: LogoTemplateId[] = [
  "officialSealTemplate",
  "premiumShieldTemplate",
  "horizontalInstitutionTemplate",
  "monogramProfileTemplate",
];

export const TEMPLATE_ETIKET: Record<LogoTemplateId, string> = {
  officialSealTemplate: "Resmi Kurum Mührü",
  premiumShieldTemplate: "Premium Kalkan Arma",
  horizontalInstitutionTemplate: "Modern Yatay Kurum",
  monogramProfileTemplate: "Monogram Profil",
};

export const TEMPLATE_KISA_ETIKET: Record<LogoTemplateId, string> = {
  officialSealTemplate: "Resmi",
  premiumShieldTemplate: "Kurumsal",
  horizontalInstitutionTemplate: "Yatay",
  monogramProfileTemplate: "Profil",
};

export const KISA_AD_SABLONLARI = new Set<LogoTemplateId>(["monogramProfileTemplate"]);

export function templateGrupEtiketi(templateId: LogoTemplateId): LogoGrupEtiketi {
  switch (templateId) {
    case "officialSealTemplate":
    case "premiumShieldTemplate":
    case "horizontalInstitutionTemplate":
      return "en_kurumsal";
    case "monogramProfileTemplate":
      return "daha_ayirt_edici";
    default:
      return "en_kurumsal";
  }
}

export function templateEtiketi(templateId: LogoTemplateId): string {
  return TEMPLATE_ETIKET[templateId];
}

export function sablonSiraForKategori(_kategori: LogoKategori): LogoTemplateId[] {
  return [...LOGO_TEMPLATE_SIRASI];
}
