export type YatiliProgramTuru =
  | "ilk_yatili"
  | "hafta_sonu"
  | "nehari_gecis"
  | "yaz_kampi_oncesi"
  | "tanisma_uyum";

export type YatiliProgramTonu = "sicak" | "kurumsal" | "ikna_edici" | "enerjik";

export type YatiliAfishSablonu = "hero_invite" | "program_flow" | "night_theme" | "trust_focused";

export type YatiliRenkTema = "lacivert_altin" | "yesil_krem" | "turuncu_lacivert" | "bordo_krem";

export type YatiliGorselModu = "buyuk_kapak" | "kucuk_destek" | "gorselsiz";

export type YatiliFormAdimi = 1 | 2 | 3 | 4 | 5;

export type YatiliYogunlukModu = "sade" | "dengeli" | "detayli" | "veli_odakli" | "gorsel_odakli";

export type YatiliVurguOdagi = "tarih" | "guven" | "gunluk_program" | "gorsel" | "basvuru" | "slogan";

export type YatiliArkaPlanId =
  | "krem_doku"
  | "gece_doku"
  | "geometrik"
  | "sicak_gradient"
  | "kurumsal_desen"
  | "premium_gorselsiz";

export type YatiliBlokId =
  | "kurum"
  | "baslik"
  | "tarih"
  | "sinifYas"
  | "kontenjan"
  | "kisaAciklama"
  | "guven"
  | "gunlukProgram"
  | "maddeler"
  | "veliNot"
  | "slogan"
  | "iletisim"
  | "qr"
  | "gorsel";

export type YatiliBlokAyarlari = Record<YatiliBlokId, boolean>;

export type GunlukProgramSatiri = { saat: string; etkinlik: string };

export type YatiliOtomatikMetin = {
  programTitle: string;
  shortIntro: string;
  trustMessage: string;
  activities: string[];
  parentNote: string;
  slogan: string;
  callToAction: string;
};

export type YatiliProgramFormData = {
  programTuru: YatiliProgramTuru;
  kurumAdi: string;
  programTarihi: string;
  sinifYasGrubu: string;
  kontenjan: string;
  iletisim: string;
  qrLink: string;
  gorseller: string[];
  gorselModu: YatiliGorselModu;
  programTonu: YatiliProgramTonu;
  sablon: YatiliAfishSablonu;
  renkTema: YatiliRenkTema;
  arkaPlanId: YatiliArkaPlanId;
  yogunlukModu: YatiliYogunlukModu;
  vurguOdagi: YatiliVurguOdagi;
  bloklar: YatiliBlokAyarlari;
  gunlukProgram: GunlukProgramSatiri[];
} & YatiliOtomatikMetin;

export const YATILI_PROGRAM_TURLERI: {
  id: YatiliProgramTuru;
  ad: string;
  kisa: string;
  ikon: string;
  ipucu: string;
}[] = [
  {
    id: "ilk_yatili",
    ad: "İlk Yatılı Alıştırma",
    kisa: "Yurda ilk adım ve kaynaşma",
    ikon: "🏠",
    ipucu: "Davet + güven + program maddeleri",
  },
  {
    id: "hafta_sonu",
    ad: "Hafta Sonu Yatılı Programı",
    kisa: "Hafta sonu yurt deneyimi",
    ikon: "📅",
    ipucu: "Tarih + günlük akış vurgulu",
  },
  {
    id: "nehari_gecis",
    ad: "Nehari'den Yatılıya Geçiş",
    kisa: "Yatılı sürece hazırlık",
    ikon: "🔄",
    ipucu: "Veli notu + güven metni",
  },
  {
    id: "yaz_kampi_oncesi",
    ad: "Yaz Kampı Öncesi Alıştırma",
    kisa: "Kampa hazırlık ve uyum",
    ikon: "☀️",
    ipucu: "Enerjik slogan + maddeler",
  },
  {
    id: "tanisma_uyum",
    ad: "Tanışma ve Uyum Gecesi",
    kisa: "Tanışma ve yurt hayatına giriş",
    ikon: "🌙",
    ipucu: "Gece teması + kısa program",
  },
];

export type YatiliSablonMeta = {
  id: YatiliAfishSablonu;
  ad: string;
  kisa: string;
  oneCikan: string;
  uygun: string;
  his: string;
  temaRenk: string;
};

export const YATILI_SABLON_META: YatiliSablonMeta[] = [
  {
    id: "hero_invite",
    ad: "Kahraman Görselli Davet",
    kisa: "Büyük görsel, enerjik davet",
    oneCikan: "Büyük görsel",
    uygun: "Görsel odaklı / Sade",
    his: "Enerjik",
    temaRenk: "#e85d04",
  },
  {
    id: "program_flow",
    ad: "Program Akışı Odaklı",
    kisa: "Günlük program ve maddeler",
    oneCikan: "Günlük program",
    uygun: "Detaylı / Dengeli",
    his: "Açıklayıcı",
    temaRenk: "#1e3a5f",
  },
  {
    id: "night_theme",
    ad: "Gece Temalı",
    kisa: "Gece atmosferi, güçlü slogan",
    oneCikan: "Atmosfer",
    uygun: "Sade / Görsel odaklı",
    his: "Sıcak gece",
    temaRenk: "#0f2744",
  },
  {
    id: "trust_focused",
    ad: "Veli Güven Odaklı",
    kisa: "Güven metni merkezde",
    oneCikan: "Güven metni",
    uygun: "Veli odaklı",
    his: "Kurumsal güven",
    temaRenk: "#6d2e46",
  },
];

export const YATILI_SABLONLAR = YATILI_SABLON_META.map(({ id, ad, kisa }) => ({ id, ad, kisa }));

export const YATILI_RENK_TEMALARI: { id: YatiliRenkTema; ad: string }[] = [
  { id: "lacivert_altin", ad: "Lacivert — Altın" },
  { id: "yesil_krem", ad: "Yeşil — Krem" },
  { id: "turuncu_lacivert", ad: "Turuncu — Lacivert" },
  { id: "bordo_krem", ad: "Bordo — Krem" },
];

export const YATILI_YOGUNLUK_MODLARI: { id: YatiliYogunlukModu; ad: string; kisa: string; icerik: string }[] = [
  {
    id: "sade",
    ad: "Sade",
    kisa: "Hızlı davet",
    icerik: "Başlık + kısa açıklama + slogan + iletişim",
  },
  {
    id: "dengeli",
    ad: "Dengeli",
    kisa: "Standart afiş",
    icerik: "Başlık + açıklama + güven metni + maddeler + iletişim",
  },
  {
    id: "detayli",
    ad: "Detaylı",
    kisa: "Tam bilgi",
    icerik: "Başlık + açıklama + güven + günlük program + veli notu + QR",
  },
  {
    id: "veli_odakli",
    ad: "Veli odaklı",
    kisa: "Güven öncelikli",
    icerik: "Güven metni + veli notu + kısa maddeler + iletişim",
  },
  {
    id: "gorsel_odakli",
    ad: "Görsel odaklı",
    kisa: "Kapak odaklı",
    icerik: "Büyük görsel + kısa metin + slogan + QR",
  },
];

/** İnce ayar panelinde gösterilen bloklar */
export const YATILI_INCE_AYAR_BLOKLARI: YatiliBlokId[] = [
  "kisaAciklama",
  "guven",
  "gunlukProgram",
  "maddeler",
  "veliNot",
  "slogan",
  "kontenjan",
  "qr",
  "gorsel",
];

export const YATILI_VURGU_SECENEKLERI: { id: YatiliVurguOdagi; ad: string }[] = [
  { id: "tarih", ad: "Tarih" },
  { id: "guven", ad: "Güven" },
  { id: "gunluk_program", ad: "Günlük program" },
  { id: "gorsel", ad: "Görsel" },
  { id: "basvuru", ad: "Başvuru / QR" },
  { id: "slogan", ad: "Slogan" },
];

export function varsayilanBloklar(): YatiliBlokAyarlari {
  return {
    kurum: true,
    baslik: true,
    tarih: true,
    sinifYas: true,
    kontenjan: true,
    kisaAciklama: true,
    guven: true,
    gunlukProgram: false,
    maddeler: true,
    veliNot: false,
    slogan: true,
    iletisim: true,
    qr: true,
    gorsel: true,
  };
}

export function bosYatiliFormu(): YatiliProgramFormData {
  return {
    programTuru: "ilk_yatili",
    kurumAdi: "",
    programTarihi: "",
    sinifYasGrubu: "",
    kontenjan: "",
    iletisim: "",
    qrLink: "",
    gorseller: [],
    gorselModu: "buyuk_kapak",
    programTonu: "sicak",
    sablon: "hero_invite",
    renkTema: "lacivert_altin",
    arkaPlanId: "sicak_gradient",
    yogunlukModu: "dengeli",
    vurguOdagi: "tarih",
    bloklar: varsayilanBloklar(),
    gunlukProgram: [],
    programTitle: "",
    shortIntro: "",
    trustMessage: "",
    activities: [],
    parentNote: "",
    slogan: "",
    callToAction: "",
  };
}
