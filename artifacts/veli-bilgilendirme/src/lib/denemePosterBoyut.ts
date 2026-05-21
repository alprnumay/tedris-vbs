import type { AfisFormati } from "@/types/denemeSinavi";

const BASE = 520;

/** Önizleme ve dışa aktarım için mantıksal piksel boyutları (sabit taban genişlik / yükseklik). */
export function afisBoyutlari(format: AfisFormati): { width: number; minHeight: number } {
  switch (format) {
    case "kare":
      return { width: BASE, minHeight: BASE };
    case "dikey":
      return { width: BASE, minHeight: Math.round((BASE * 4) / 3) };
    case "story":
      return { width: BASE, minHeight: Math.round((BASE * 16) / 9) };
    case "a4":
      return { width: BASE, minHeight: Math.round(BASE * 1.41421356) };
    case "yatay":
      return { width: Math.round((BASE * 4) / 3), minHeight: BASE };
    default:
      return { width: BASE, minHeight: 693 };
  }
}
