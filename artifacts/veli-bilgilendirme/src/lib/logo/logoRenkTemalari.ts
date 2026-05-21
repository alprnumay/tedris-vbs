import type { LogoPalette, LogoRenkTema } from "@/types/logoKimlik";

export interface LogoRenkTemaMeta {
  id: LogoRenkTema;
  ad: string;
  palette: LogoPalette;
}

export const LOGO_RENK_TEMALARI: LogoRenkTemaMeta[] = [
  {
    id: "lacivert_altin",
    ad: "Lacivert — Altın",
    palette: { primary: "#1e3a5f", secondary: "#c9a227", accent: "#f8fafc", text: "#0f172a", muted: "#64748b" },
  },
  {
    id: "yesil_krem",
    ad: "Yeşil — Krem",
    palette: { primary: "#166534", secondary: "#d6cfc0", accent: "#faf8f5", text: "#14532d", muted: "#4d7c57" },
  },
  {
    id: "bordo_altin",
    ad: "Bordo — Altın",
    palette: { primary: "#7f1d1d", secondary: "#ca8a04", accent: "#fffbeb", text: "#450a0a", muted: "#9f1239" },
  },
  {
    id: "mavi_gumus",
    ad: "Mavi — Gümüş",
    palette: { primary: "#1d4ed8", secondary: "#94a3b8", accent: "#f1f5f9", text: "#1e3a8a", muted: "#64748b" },
  },
  {
    id: "siyah_beyaz",
    ad: "Siyah — Beyaz",
    palette: { primary: "#0f172a", secondary: "#e2e8f0", accent: "#ffffff", text: "#0f172a", muted: "#475569" },
  },
  {
    id: "kahve_bej",
    ad: "Kahve — Bej",
    palette: { primary: "#78350f", secondary: "#e7e5e4", accent: "#fafaf9", text: "#44403c", muted: "#78716c" },
  },
];

export function paletAl(tema: LogoRenkTema): LogoPalette {
  return LOGO_RENK_TEMALARI.find((t) => t.id === tema)?.palette ?? LOGO_RENK_TEMALARI[0].palette;
}
