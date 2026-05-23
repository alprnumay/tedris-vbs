import type { SablonTuru } from "@/types";

export type GorselBoyut = { width: number; height: number; dikey: boolean };

export function gorselBoyutOku(src: string): Promise<GorselBoyut> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const dikey = img.naturalHeight > img.naturalWidth * 1.05;
      resolve({ width: img.naturalWidth, height: img.naturalHeight, dikey });
    };
    img.onerror = () => resolve({ width: 1, height: 1, dikey: false });
    img.src = src;
  });
}

/** Dikey görseller için daha uygun şablonlar */
export const DIKEY_GORSEL_SABLONLAR: SablonTuru[] = [
  "fotograf-odakli",
  "hikaye",
  "premium-minimal",
  "etkinlik",
];

export function dikeyGorselSablonOner(secili: SablonTuru): SablonTuru | null {
  const yatayUyumlu = new Set<SablonTuru>(["akademik", "bulten", "kartli-bilgi", "kurumsal-resmi"]);
  if (!yatayUyumlu.has(secili)) return null;
  return "fotograf-odakli";
}
