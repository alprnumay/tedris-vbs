import type { LogoKategori } from "@/types/logoKimlik";

export interface LogoKategoriMeta {
  id: LogoKategori;
  ad: string;
  aciklama: string;
  varsayilanYon: "symbol" | "monogram" | "combined" | "wordmark";
}

export const LOGO_KATEGORILERI: LogoKategoriMeta[] = [
  {
    id: "kurumsal_arma",
    ad: "Kurumsal Arma",
    aciklama: "Yurt ve kurum ana logosu için resmi, güven veren arma tasarımları.",
    varsayilanYon: "combined",
  },
  {
    id: "monogram",
    ad: "Harf / Monogram",
    aciklama: "Kurum adının baş harflerinden özgün monogram; Türkçe karakter destekli.",
    varsayilanYon: "monogram",
  },
];
