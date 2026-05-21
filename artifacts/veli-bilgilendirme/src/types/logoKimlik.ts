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

export type LogoShapeId = "daire_arma" | "kalkan" | "rozet" | "minimal_yuvarlak";
export type LogoIconId = "kitap" | "mesale" | "yildiz" | "defne" | "kalem";
export type LogoLayoutId = "merkez_ust_ad" | "merkez_alt_slogan" | "rozet_cevre" | "monogram_merkez";
export type LogoFontPairId = "klasik_serif" | "modern_sans" | "guclu_kurumsal" | "sade_minimal";
export type LogoBorderId = "ince" | "kalin" | "cift" | "yok";
export type LogoOrnamentId = "none" | "ust_cizgi" | "alt_cizgi" | "kose_nokta";

export type LogoGrupEtiketi = "en_kurumsal" | "daha_modern" | "daha_sade" | "daha_ayirt_edici";

export interface LogoKurumBilgisi {
  kurumAdi: string;
  kisaAd: string;
  slogan: string;
  sehir: string;
  ilce: string;
  kurulusYili: string;
}

export interface LogoSihirbazForm {
  kategori: LogoKategori | null;
  kurum: LogoKurumBilgisi;
  karakterler: LogoKarakter[];
  gorselYon: LogoGorselYon;
  renkTema: LogoRenkTema;
}

export interface LogoPalette {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  muted: string;
}

export interface LogoConfigV1 {
  version: 1;
  category: LogoKategori;
  organization: LogoKurumBilgisi;
  traits: LogoKarakter[];
  visualDirection: LogoGorselYon;
  colorTheme: LogoRenkTema;
  variant: {
    shapeId: LogoShapeId;
    borderId: LogoBorderId;
    iconId: LogoIconId;
    layoutId: LogoLayoutId;
    fontPairId: LogoFontPairId;
    ornamentId: LogoOrnamentId;
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
  };
}
