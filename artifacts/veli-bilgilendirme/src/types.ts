export interface Faaliyet {
  tur: string;
  alan: string;
  ozelNot: string;
}

export interface FormData {
  kurumAdi: string;
  isim: string;
  rol: string;
  faaliyetSayisi: number;
  faaliyetler: Faaliyet[];
  metinUzunlugu: "detayli" | "kisa";
  metinTonu?: "kurumsal" | "sicak" | "aciklayici";
  kapanisCumlesi?: string;
  posterMetni: string;
  ekNot: string;
  gorseller: string[];
  seciliBaslikIdx: number;
}

export interface SavedProfile {
  id: string;
  isim: string;
  kurumAdi: string;
  rol: string;
}

export type SablonTuru =
  | "akademik"
  | "etkinlik"
  | "bulten"
  | "lacivert"
  | "mor"
  | "kirmizi"
  | "turuncu"
  | "pembe"
  | "teal"
  | "altin"
  | "premium-minimal"
  | "kartli-bilgi"
  | "kurumsal-resmi"
  | "hikaye"
  | "fotograf-odakli"
  | "kurumsal-kart"
  | "pro-minimal"
  | "hero-gorselli"
  | "split-layout"
  | "egitim-panosu"
  | "bento-kart"
  | "akademik-cizgi"
  | "veli-notu"
  | "etkinlik-rozetli"
  | "dergi-stili"
  | "sicak-album"
  | "kartli-bilgi-pro"
  | "zaman-akisi"
  | "cerceveli-klasik"
  | "modern-grid"
  | "poster-duyuru"
  | "foto-kolaj-premium"
  | "kurumsal-lacivert"
  | "soft-paper"
  | "imza-tasarim"
  | "kolaj-bulten"
  | "dergi-sayfasi"
  | "gunluk-akis"
  | "foto-albumu"
  | "tek-guclu-afis"
  | "sinif-rapor-karti"
  | "duyuru-panosu"
  | "mini-brosur"
  | "yan-serit-kurumsal"
  | "coklu-faaliyet-raporu";
