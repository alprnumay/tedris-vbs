import type { LogoConfigV1, LogoFontPairId, LogoIconId, LogoRenkTema, LogoSihirbazForm, LogoTemplateId } from "@/types/logoKimlik";
import { LOGO_PREMIUM_TEMA_IDS, paletAl } from "./logoRenkTemalari";
import { logoFingerprintOlustur } from "./logoFingerprint";
import { LOGO_TEMPLATE_SIRASI, templateGrupEtiketi } from "./logoTemplates";

const SABLON_IKON: Record<LogoTemplateId, LogoIconId> = {
  officialSealTemplate: "kitap",
  premiumShieldTemplate: "yildiz",
  horizontalInstitutionTemplate: "mesale",
  monogramProfileTemplate: "yildiz",
};

const SABLON_FONT: Record<LogoTemplateId, LogoFontPairId> = {
  officialSealTemplate: "klasik_serif",
  premiumShieldTemplate: "guclu_kurumsal",
  horizontalInstitutionTemplate: "guclu_kurumsal",
  monogramProfileTemplate: "klasik_serif",
};

const SABLON_VARSAYILAN_TEMA: Record<LogoTemplateId, LogoRenkTema> = {
  officialSealTemplate: "lacivert_altin",
  premiumShieldTemplate: "lacivert_altin",
  horizontalInstitutionTemplate: "lacivert_altin",
  monogramProfileTemplate: "bordo_altin",
};

function temaForSlot(templateId: LogoTemplateId, formTema: LogoRenkTema, varyasyonIndex: number): LogoRenkTema {
  const temalar = LOGO_PREMIUM_TEMA_IDS;
  const varsayilan = SABLON_VARSAYILAN_TEMA[templateId];
  const slot = (varyasyonIndex + LOGO_TEMPLATE_SIRASI.indexOf(templateId)) % temalar.length;
  if (varyasyonIndex === 0 && temalar.includes(formTema)) return formTema;
  if (varyasyonIndex === 0) return varsayilan;
  return temalar[slot] ?? varsayilan;
}

/** 4 premium şablon — rastgele üretim yok */
export function logoOnerileriUret(form: LogoSihirbazForm, varyasyonIndex = 0): LogoConfigV1[] {
  if (!form.kategori) return [];

  return LOGO_TEMPLATE_SIRASI.map((templateId) => {
    const colorTheme = temaForSlot(templateId, form.renkTema, varyasyonIndex);
    const draft: LogoConfigV1 = {
      version: 1,
      category: form.kategori!,
      organization: { ...form.kurum },
      traits: [...form.karakterler],
      visualDirection: form.gorselYon,
      colorTheme,
      templateId,
      variant: {
        iconId: SABLON_IKON[templateId],
        fontPairId: SABLON_FONT[templateId],
      },
      display: {
        showTagline: Boolean(form.kurum.slogan.trim()),
        showYear: Boolean(form.kurum.kurulusYili.trim()),
        showCity: Boolean(form.kurum.sehir.trim()),
        titleScale: 1,
      },
      palette: paletAl(colorTheme),
      seed: `v${varyasyonIndex}`,
      groupLabel: templateGrupEtiketi(templateId),
      fingerprint: "",
      lego:
        templateId === "premiumShieldTemplate"
          ? { shieldId: form.selectedShieldId, emblemId: form.selectedEmblemId }
          : undefined,
    };
    draft.fingerprint = logoFingerprintOlustur(draft);
    return draft;
  });
}

export function sonrakiVaryasyonIndex(mevcut: number): number {
  return mevcut + 1;
}
