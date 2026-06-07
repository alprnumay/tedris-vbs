export const INVITE_POSTER = {
  width: 1600,
  height: 900,
  orientation: "landscape" as const,
  aspect: "16 / 9",
};

export type PosterOrientation = "landscape" | "portrait";

export interface PosterSpec {
  width: number;
  height: number;
  orientation: PosterOrientation;
}

/** Yatılı program şablonları — sabit çıktı alanı (önizleme küçülür, export tam boy). */
export function getBoardingPosterSpec(sablon: string): PosterSpec {
  const portraitTemplates = new Set(["3", "4"]);
  if (portraitTemplates.has(sablon)) {
    return { width: 1080, height: 1350, orientation: "portrait" };
  }
  return { width: 1600, height: 900, orientation: "landscape" };
}
