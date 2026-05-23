import { SablonTuru } from "../types";

export const SABLON_GORSEL_LIMITLERI: Record<SablonTuru, number> = {
  "premium-minimal": 4,
  "akademik": 4,
  "etkinlik": 4,
  "bulten": 4,
  "lacivert": 4,
  "mor": 4,
  "kirmizi": 4,
  "turuncu": 4,
  "pembe": 4,
  "teal": 4,
  "altin": 4,
  "kartli-bilgi": 4,
  "kurumsal-resmi": 4,
  "hikaye": 4,
  "fotograf-odakli": 3,
};

export type TemaliLayout = "klasik" | "sidebar" | "karti";

export const TEMALI_LAYOUT: Partial<Record<SablonTuru, TemaliLayout>> = {
  lacivert: "klasik",
  mor: "sidebar",
  kirmizi: "klasik",
  turuncu: "karti",
  pembe: "sidebar",
  teal: "karti",
  altin: "klasik",
};

export interface SablonMeta {
  id: SablonTuru;
  ad: string;
  chipRenk: string;
  etiket: string;
  maxGorsel: number;
  yeni?: boolean;
  /** Kullanıcıya hangi durumda seçileceği */
  kullanim?: string;
  etiketler?: string[];
}

export const SABLON_LISTESI: SablonMeta[] = [
  {
    id: "akademik",
    ad: "Kurumsal Mavi",
    chipRenk: "#1e3a5f",
    etiket: "Kurumsal",
    maxGorsel: 4,
    kullanim: "Günlük ders ve etüt bilgilendirmeleri için ideal.",
    etiketler: ["3–4 görsel", "Kurumsal"],
  },
  {
    id: "etkinlik",
    ad: "Etkinlik Yeşil",
    chipRenk: "#14532d",
    etiket: "Etkinlik",
    maxGorsel: 4,
    kullanim: "Etkinlikler ve gezi duyurularında güçlü görünür.",
    etiketler: ["Etkinlik", "Fotoğraflı"],
  },
  {
    id: "bulten",
    ad: "Bülten Kahve",
    chipRenk: "#78350f",
    etiket: "Bülten",
    maxGorsel: 4,
    kullanim: "Çoklu görsel ve haftalık özet paylaşımları için.",
    etiketler: ["4 görsel", "Özet"],
  },
  { id: "lacivert",        ad: "Resmi Lacivert",  chipRenk: "#0f172a", etiket: "Temalı",    maxGorsel: 4 },
  { id: "mor",             ad: "Rehberlik Mor",   chipRenk: "#4c1d95", etiket: "Temalı",    maxGorsel: 4 },
  { id: "kirmizi",         ad: "Enerji Kırmızı",  chipRenk: "#991b1b", etiket: "Temalı",    maxGorsel: 4 },
  { id: "turuncu",         ad: "Bahar Turuncu",   chipRenk: "#c2410c", etiket: "Temalı",    maxGorsel: 4 },
  { id: "pembe",           ad: "Anaokulu Pembe",  chipRenk: "#9d174d", etiket: "Temalı",    maxGorsel: 4 },
  { id: "teal",            ad: "Doğa Teal",       chipRenk: "#115e59", etiket: "Temalı",    maxGorsel: 4 },
  {
    id: "altin",
    ad: "Altın Sarı",
    chipRenk: "#92400e",
    etiket: "Temalı",
    maxGorsel: 4,
    kullanim: "Fotoğraflı ve sıcak veli bilgilendirmeleri için.",
    etiketler: ["Fotoğraflı", "Sıcak"],
  },
  {
    id: "premium-minimal",
    ad: "Premium Minimal",
    chipRenk: "#334155",
    etiket: "Minimal",
    maxGorsel: 4,
    yeni: true,
    kullanim: "Az metinli, sade ve kurumsal afişler için.",
    etiketler: ["Az metin", "Kurumsal", "Görselsiz uygun"],
  },
  {
    id: "kartli-bilgi",
    ad: "Kartlı Bilgi",
    chipRenk: "#2563eb",
    etiket: "Kartlı",
    maxGorsel: 4,
    yeni: true,
    kullanim: "Ders / etüt çalışmalarını net göstermek için.",
    etiketler: ["Ders/etüt", "Detaylı bilgi"],
  },
  {
    id: "kurumsal-resmi",
    ad: "Kurumsal Resmi",
    chipRenk: "#1e293b",
    etiket: "Resmi",
    maxGorsel: 4,
    yeni: true,
    kullanim: "Resmi duyuru ve kurumsal bilgilendirme için.",
    etiketler: ["Kurumsal", "Görselsiz uygun"],
  },
  {
    id: "hikaye",
    ad: "Hikaye Stili",
    chipRenk: "#c8956c",
    etiket: "Hikaye",
    maxGorsel: 4,
    yeni: true,
    kullanim: "Sıcak, hikâye anlatımı hissi veren paylaşımlar için.",
    etiketler: ["Sıcak", "Fotoğraflı"],
  },
  {
    id: "fotograf-odakli",
    ad: "Fotoğraf Odaklı",
    chipRenk: "#0ea5e9",
    etiket: "Kolaj",
    maxGorsel: 3,
    yeni: true,
    kullanim: "1–2 güçlü fotoğrafla dikkat çekici bilgilendirme için.",
    etiketler: ["Fotoğraflı", "Dikkat çekici"],
  },
];
