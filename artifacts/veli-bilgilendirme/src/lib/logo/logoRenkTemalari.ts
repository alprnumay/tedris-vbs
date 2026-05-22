import type { LogoPalette, LogoRenkTema } from "@/types/logoKimlik";

export interface LogoRenkTemaMeta {
  id: LogoRenkTema;
  ad: string;
  palette: LogoPalette;
}

/** Premium kontrollü paletler — rastgele renk yok */
export const LOGO_RENK_TEMALARI: LogoRenkTemaMeta[] = [
  {
    id: "lacivert_altin",
    ad: "Lacivert — Altın",
    palette: {
      primary: "#16345C",
      primaryDark: "#0E223F",
      secondary: "#C99A2E",
      secondarySoft: "#E7C86E",
      accent: "#F8F1DD",
      text: "#10233F",
      muted: "#3D5472",
      white: "#FFFFFF",
    },
  },
  {
    id: "bordo_altin",
    ad: "Bordo — Altın",
    palette: {
      primary: "#8B1E24",
      primaryDark: "#5F1116",
      secondary: "#C99A2E",
      secondarySoft: "#E7C86E",
      accent: "#F8F1DD",
      text: "#5F1116",
      muted: "#7A3A3F",
      white: "#FFFFFF",
    },
  },
  {
    id: "yesil_krem",
    ad: "Yeşil — Krem",
    palette: {
      primary: "#1D6B46",
      primaryDark: "#0F3E2A",
      secondary: "#C99A2E",
      secondarySoft: "#E7C86E",
      accent: "#F8F1DD",
      text: "#0F3E2A",
      muted: "#3A6B52",
      white: "#FFFFFF",
    },
  },
  {
    id: "siyah_beyaz",
    ad: "Siyah — Altın",
    palette: {
      primary: "#151515",
      primaryDark: "#0A0A0A",
      secondary: "#C99A2E",
      secondarySoft: "#E7C86E",
      accent: "#F8F1DD",
      text: "#2A2A2A",
      muted: "#5A5A5A",
      white: "#FFFFFF",
    },
  },
];

export const LOGO_PREMIUM_TEMA_IDS = LOGO_RENK_TEMALARI.map((t) => t.id);

export function paletAl(tema: LogoRenkTema): LogoPalette {
  return LOGO_RENK_TEMALARI.find((t) => t.id === tema)?.palette ?? LOGO_RENK_TEMALARI[0].palette;
}
