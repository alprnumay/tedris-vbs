export type LogoKategori = "kurumsal_arma" | "monogram";

export type LogoKarakter =
  | "guven_veren"
  | "akademik"
  | "sefkatli"
  | "disiplinli"
  | "geleneksel"
  | "modern"
  | "sade"
  | "guclu";

export type LogoGorselYon = "symbol" | "monogram" | "combined" | "wordmark";

export type LogoRenkTema =
  | "lacivert_altin"
  | "yesil_krem"
  | "bordo_altin"
  | "mavi_gumus"
  | "siyah_beyaz"
  | "kahve_bej";

/** Elle tanımlı premium logo şablonları — yalnızca 4 kontrollü şablon */
export type LogoTemplateId =
  | "officialSealTemplate"
  | "premiumShieldTemplate"
  | "horizontalInstitutionTemplate"
  | "monogramProfileTemplate";

export type LogoIconId = "kitap" | "mesale" | "yildiz" | "defne" | "kalem";
export type LogoFontPairId = "klasik_serif" | "modern_sans" | "guclu_kurumsal" | "sade_minimal";

export type LogoGrupEtiketi = "en_kurumsal" | "daha_modern" | "daha_sade" | "daha_ayirt_edici";

export interface LogoKurumBilgisi {
  kurumAdi: string;
  kisaAd: string;
  slogan: string;
  sehir: string;
  ilce: string;
  kurulusYili: string;
}

/** Modüler kalkan — önceden çizilmiş parça seçimi */
export interface LogoLegoSecim {
  shieldId: string;
  emblemId: string;
}

export interface LogoSihirbazForm {
  kategori: LogoKategori | null;
  kurum: LogoKurumBilgisi;
  karakterler: LogoKarakter[];
  gorselYon: LogoGorselYon;
  renkTema: LogoRenkTema;
  selectedShieldId: string;
  selectedEmblemId: string;
}

export interface LogoPalette {
  primary: string;
  primaryDark: string;
  secondary: string;
  secondarySoft: string;
  accent: string;
  text: string;
  muted: string;
  white: string;
}

export interface LogoConfigV1 {
  version: 1;
  category: LogoKategori;
  organization: LogoKurumBilgisi;
  traits: LogoKarakter[];
  visualDirection: LogoGorselYon;
  colorTheme: LogoRenkTema;
  templateId: LogoTemplateId;
  variant: {
    iconId: LogoIconId;
    fontPairId: LogoFontPairId;
  };
  display: {
    showTagline: boolean;
    showYear: boolean;
    showCity: boolean;
    titleScale: number;
  };
  palette: LogoPalette;
  seed: string;
  groupLabel: LogoGrupEtiketi;
  fingerprint: string;
  lego?: LogoLegoSecim;
}

export type LogoModulAsama = "kategori" | "form" | "oneriler" | "secim";

export function bosLogoSihirbazForm(): LogoSihirbazForm {
  return {
    kategori: null,
    kurum: {
      kurumAdi: "",
      kisaAd: "",
      slogan: "",
      sehir: "",
      ilce: "",
      kurulusYili: "",
    },
    karakterler: [],
    gorselYon: "combined",
    renkTema: "lacivert_altin",
    selectedShieldId: "shield_luxury_curved",
    selectedEmblemId: "emblem_abstract_flame",
  };
}
