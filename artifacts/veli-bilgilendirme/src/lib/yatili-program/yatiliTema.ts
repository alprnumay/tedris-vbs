import type { YatiliRenkTema } from "@/types/yatiliProgram";

export type YatiliPosterTema = {
  id: YatiliRenkTema;
  primary: string;
  primaryDark: string;
  accent: string;
  accentSoft: string;
  cream: string;
  text: string;
  textMuted: string;
  gradient: string;
  nightGradient: string;
  fontFamily: string;
  headingWeight: number;
  cardRadius: number;
  patternOpacity: number;
  karakter: string;
};

export const YATILI_TEMA: Record<YatiliRenkTema, YatiliPosterTema> = {
  lacivert_altin: {
    id: "lacivert_altin",
    primary: "#1e3a5f",
    primaryDark: "#0f2744",
    accent: "#c9a227",
    accentSoft: "#f5e6b8",
    cream: "#faf8f3",
    text: "#0f172a",
    textMuted: "#64748b",
    gradient: "linear-gradient(145deg, #0f2744 0%, #1e3a5f 45%, #2d5a9e 100%)",
    nightGradient: "linear-gradient(165deg, #060d18 0%, #0f2744 40%, #1a3358 100%)",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    headingWeight: 700,
    cardRadius: 12,
    patternOpacity: 0.08,
    karakter: "kurumsal",
  },
  yesil_krem: {
    id: "yesil_krem",
    primary: "#1b4332",
    primaryDark: "#081c15",
    accent: "#95a856",
    accentSoft: "#e9edc9",
    cream: "#fefae0",
    text: "#1b4332",
    textMuted: "#52796f",
    gradient: "linear-gradient(145deg, #081c15 0%, #1b4332 50%, #40916c 100%)",
    nightGradient: "linear-gradient(165deg, #081c15 0%, #1b4332 55%, #2d6a4f 100%)",
    fontFamily: "'Segoe UI', 'Inter', system-ui, sans-serif",
    headingWeight: 600,
    cardRadius: 18,
    patternOpacity: 0.1,
    karakter: "sicak",
  },
  turuncu_lacivert: {
    id: "turuncu_lacivert",
    primary: "#e85d04",
    primaryDark: "#c44900",
    accent: "#1e3a5f",
    accentSoft: "#ffddd2",
    cream: "#fff8f0",
    text: "#1e3a5f",
    textMuted: "#6c757d",
    gradient: "linear-gradient(135deg, #c44900 0%, #e85d04 45%, #f48c06 100%)",
    nightGradient: "linear-gradient(165deg, #1e3a5f 0%, #2d5a9e 50%, #e85d04 100%)",
    fontFamily: "'Montserrat', 'Segoe UI', sans-serif",
    headingWeight: 800,
    cardRadius: 10,
    patternOpacity: 0.12,
    karakter: "enerjik",
  },
  bordo_krem: {
    id: "bordo_krem",
    primary: "#6d2e46",
    primaryDark: "#4a1528",
    accent: "#d4a373",
    accentSoft: "#f2e8cf",
    cream: "#fdf6ec",
    text: "#3d1f2b",
    textMuted: "#7d6b6f",
    gradient: "linear-gradient(145deg, #4a1528 0%, #6d2e46 55%, #8b4a6b 100%)",
    nightGradient: "linear-gradient(165deg, #4a1528 0%, #6d2e46 60%, #3d1f2b 100%)",
    fontFamily: "'Georgia', 'Palatino Linotype', serif",
    headingWeight: 650,
    cardRadius: 16,
    patternOpacity: 0.09,
    karakter: "davetkar",
  },
};

export function yatiliTemaAl(id: YatiliRenkTema): YatiliPosterTema {
  return YATILI_TEMA[id] ?? YATILI_TEMA.lacivert_altin;
}
