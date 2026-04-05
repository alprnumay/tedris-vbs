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
  | "fotograf-odakli";
