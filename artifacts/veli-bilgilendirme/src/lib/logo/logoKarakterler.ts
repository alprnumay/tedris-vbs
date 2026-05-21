import type { LogoKarakter } from "@/types/logoKimlik";

export const LOGO_KARAKTERLER: { id: LogoKarakter; label: string }[] = [
  { id: "guven_veren", label: "Güven veren" },
  { id: "akademik", label: "Akademik" },
  { id: "sefkatli", label: "Şefkatli" },
  { id: "disiplinli", label: "Disiplinli" },
  { id: "geleneksel", label: "Geleneksel" },
  { id: "modern", label: "Modern" },
  { id: "sade", label: "Sade" },
  { id: "guclu", label: "Güçlü" },
];

export const MAX_LOGO_KARAKTER = 2;

export function karakterToggle(mevcut: LogoKarakter[], id: LogoKarakter): LogoKarakter[] {
  if (mevcut.includes(id)) return mevcut.filter((k) => k !== id);
  if (mevcut.length >= MAX_LOGO_KARAKTER) return mevcut;
  return [...mevcut, id];
}
