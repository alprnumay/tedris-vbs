export type KolayAfisAdimi = 1 | 2 | 3 | 4 | 5;

export type AfisTuru =
  | "yaz_kampi"
  | "yatili_alistirma"
  | "hafta_sonu"
  | "kayit_on_kayit"
  | "egitim_programi"
  | "etkinlik_gezi"
  | "deneme_sinavi"
  | "veli_toplantisi"
  | "brosur_tanitim"
  | "diger";

export type HedefKitle = "ilkokul" | "ortaokul" | "lise" | "veliler" | "karma";

export type AfisTarzi = "sade" | "modern" | "klasik" | "enerjik" | "kurumsal" | "cocuk_dostu" | "premium";

export type BilgiYogunlugu = "kisa" | "dengeli" | "detayli";

export type VurguOdagi =
  | "baslik"
  | "tarih"
  | "program_icerigi"
  | "qr_basvuru"
  | "iletisim"
  | "gorsel"
  | "guven_mesaji";

export type AfisAilesi =
  | "hero_campaign"
  | "trust_program"
  | "program_flow"
  | "icon_feature"
  | "qr_registration"
  | "classic_info";

export type AlternatifVaryant = "sade" | "dengeli" | "enerjik";

export type AfisTemaId = "gokyuzu" | "yesil_umut" | "lacivert_altin" | "turuncu_enerji" | "bordo_kurumsal" | "mor_premium";

export type AfisMetin = {
  title: string;
  subtitle: string;
  shortIntro: string;
  trustMessage: string;
  slogan: string;
  featureItems: string[];
  callToAction: string;
  footerBand: string;
  contactText: string;
};

export type AfisBloklar = {
  kurum: boolean;
  baslik: boolean;
  altBaslik: boolean;
  tarih: boolean;
  sinifSerit: boolean;
  kisaAciklama: boolean;
  guven: boolean;
  ozellikler: boolean;
  programAkisi: boolean;
  qr: boolean;
  telefon: boolean;
  slogan: boolean;
  altBant: boolean;
};

export type KolayAfisForm = {
  afisTuru: AfisTuru;
  hedefKitle: HedefKitle;
  tarz: AfisTarzi;
  yogunluk: BilgiYogunlugu;
  vurgu: VurguOdagi;
  kurumAdi: string;
  baslik: string;
  tarih: string;
  telefon: string;
  qrLink: string;
  sinifYas: string;
  kisaAciklama: string;
  programMaddeleri: string[];
};

export type AfisBrief = {
  aile: AfisAilesi;
  varyant: AlternatifVaryant;
  tema: AfisTemaId;
  metin: AfisMetin;
  bloklar: AfisBloklar;
  tarihBuyuk: boolean;
  qrBuyuk: boolean;
  ozellikIkonlu: boolean;
};

export type AfisAlternatif = {
  id: string;
  varyant: AlternatifVaryant;
  aile: AfisAilesi;
  baslik: string;
  aciklama: string;
  brief: AfisBrief;
};

export type KolayAfisState = {
  form: KolayAfisForm;
  adim: KolayAfisAdimi;
  alternatifler: AfisAlternatif[];
  seciliAlternatifId: string | null;
  uretildi: boolean;
  duzenlemeAcik: boolean;
  qrGoster: boolean;
  ikonluMaddeler: boolean;
};

export const AFIS_TURLERI: {
  id: AfisTuru;
  ad: string;
  kisa: string;
  ikon: string;
  etiket: string;
}[] = [
  { id: "yaz_kampi", ad: "Yaz Kampı", kisa: "Yaz dönemi program duyurusu", ikon: "☀️", etiket: "İkonlu maddeler + QR" },
  { id: "yatili_alistirma", ad: "Yatılı Alıştırma", kisa: "Veliye güven veren program afişi", ikon: "🏠", etiket: "Güven + program" },
  { id: "hafta_sonu", ad: "Hafta Sonu Programı", kisa: "Hafta sonu akışı ve kayıt", ikon: "📅", etiket: "Program akışı" },
  { id: "kayit_on_kayit", ad: "Kayıt / Ön Kayıt", kisa: "Hızlı başvuru ve QR odaklı", ikon: "✅", etiket: "Büyük QR + CTA" },
  { id: "egitim_programi", ad: "Eğitim Programı", kisa: "Ders ve gelişim odaklı tanıtım", ikon: "📚", etiket: "İkonlu özellikler" },
  { id: "etkinlik_gezi", ad: "Etkinlik / Gezi", kisa: "Etkinlik tarihi ve katılım", ikon: "🚌", etiket: "Tarih + akış" },
  { id: "deneme_sinavi", ad: "Deneme Sınavı", kisa: "Sınav tarihi ve başvuru", ikon: "📝", etiket: "Tarih + QR" },
  { id: "veli_toplantisi", ad: "Veli Toplantısı", kisa: "Kurumsal bilgilendirme", ikon: "👨‍👩‍👧", etiket: "Klasik duyuru" },
  { id: "brosur_tanitim", ad: "Broşür Tarzı Tanıtım", kisa: "Kurum tanıtımı", ikon: "📋", etiket: "Özellik kutuları" },
  { id: "diger", ad: "Diğer", kisa: "Genel amaçlı afiş", ikon: "✨", etiket: "Dengeli düzen" },
];

export const HEDEF_KITLELER: { id: HedefKitle; ad: string }[] = [
  { id: "ilkokul", ad: "İlkokul" },
  { id: "ortaokul", ad: "Ortaokul" },
  { id: "lise", ad: "Lise" },
  { id: "veliler", ad: "Veliler" },
  { id: "karma", ad: "Karma" },
];

export const AFIS_TARZLARI: { id: AfisTarzi; ad: string }[] = [
  { id: "sade", ad: "Sade" },
  { id: "modern", ad: "Modern" },
  { id: "klasik", ad: "Klasik" },
  { id: "enerjik", ad: "Enerjik" },
  { id: "kurumsal", ad: "Kurumsal" },
  { id: "cocuk_dostu", ad: "Çocuk dostu" },
  { id: "premium", ad: "Premium" },
];

export const YOGUNLUK_SECENEKLERI: { id: BilgiYogunlugu; ad: string; kisa: string }[] = [
  { id: "kisa", ad: "Kısa", kisa: "Az metin, net mesaj" },
  { id: "dengeli", ad: "Dengeli", kisa: "Standart afiş" },
  { id: "detayli", ad: "Detaylı", kisa: "Daha fazla bilgi" },
];

export const VURGU_SECENEKLERI: { id: VurguOdagi; ad: string }[] = [
  { id: "baslik", ad: "Başlık" },
  { id: "tarih", ad: "Tarih" },
  { id: "program_icerigi", ad: "Program içeriği" },
  { id: "qr_basvuru", ad: "QR / Başvuru" },
  { id: "iletisim", ad: "İletişim" },
  { id: "gorsel", ad: "Görsel" },
  { id: "guven_mesaji", ad: "Güven mesajı" },
];

export const AILE_ADLARI: Record<AfisAilesi, string> = {
  hero_campaign: "Kahraman Kampanya",
  trust_program: "Güven Programı",
  program_flow: "Program Akışı",
  icon_feature: "İkonlu Özellikler",
  qr_registration: "QR Kayıt",
  classic_info: "Klasik Bilgi",
};

export function bosKolayAfisForm(): KolayAfisForm {
  return {
    afisTuru: "yaz_kampi",
    hedefKitle: "karma",
    tarz: "enerjik",
    yogunluk: "dengeli",
    vurgu: "program_icerigi",
    kurumAdi: "",
    baslik: "",
    tarih: "",
    telefon: "",
    qrLink: "",
    sinifYas: "",
    kisaAciklama: "",
    programMaddeleri: [],
  };
}
