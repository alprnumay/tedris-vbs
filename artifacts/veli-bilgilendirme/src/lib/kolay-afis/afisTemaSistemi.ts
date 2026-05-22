import type { AfisTarzi, AfisTemaId, AfisTuru } from "@/types/kolayAfis";

export type AfisTema = {
  id: AfisTemaId;
  ad: string;
  primary: string;
  primaryDark: string;
  accent: string;
  accentSoft: string;
  surface: string;
  text: string;
  textMuted: string;
  skyGradient: string;
  footerBg: string;
  cardBg: string;
  fontFamily: string;
};

export const AFIS_TEMALAR: Record<AfisTemaId, AfisTema> = {
  gokyuzu: {
    id: "gokyuzu",
    ad: "Gökyüzü",
    primary: "#1e6bb8",
    primaryDark: "#0d4a8a",
    accent: "#f59e0b",
    accentSoft: "#fef3c7",
    surface: "#e8f4fc",
    text: "#0f2744",
    textMuted: "#475569",
    skyGradient: "linear-gradient(165deg, #7ec8e8 0%, #4a9fd4 35%, #2d7ab8 70%, #1a5f9e 100%)",
    footerBg: "linear-gradient(90deg, #0d4a8a, #1e6bb8)",
    cardBg: "rgba(255,255,255,0.92)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  yesil_umut: {
    id: "yesil_umut",
    ad: "Yeşil Umut",
    primary: "#166534",
    primaryDark: "#14532d",
    accent: "#ca8a04",
    accentSoft: "#ecfccb",
    surface: "#f0fdf4",
    text: "#14532d",
    textMuted: "#4d7c0f",
    skyGradient: "linear-gradient(160deg, #86efac 0%, #4ade80 40%, #22c55e 100%)",
    footerBg: "linear-gradient(90deg, #14532d, #166534)",
    cardBg: "rgba(255,255,255,0.94)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  lacivert_altin: {
    id: "lacivert_altin",
    ad: "Lacivert — Altın",
    primary: "#1e3a5f",
    primaryDark: "#0f2744",
    accent: "#c9a227",
    accentSoft: "#f5e6b8",
    surface: "#faf8f3",
    text: "#0f172a",
    textMuted: "#64748b",
    skyGradient: "linear-gradient(155deg, #2d5a9e 0%, #1e3a5f 50%, #0f2744 100%)",
    footerBg: "linear-gradient(90deg, #0f2744, #1e3a5f)",
    cardBg: "rgba(255,255,255,0.95)",
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  turuncu_enerji: {
    id: "turuncu_enerji",
    ad: "Turuncu Enerji",
    primary: "#c2410c",
    primaryDark: "#9a3412",
    accent: "#fbbf24",
    accentSoft: "#ffedd5",
    surface: "#fff7ed",
    text: "#431407",
    textMuted: "#9a3412",
    skyGradient: "linear-gradient(160deg, #fdba74 0%, #fb923c 40%, #ea580c 100%)",
    footerBg: "linear-gradient(90deg, #9a3412, #c2410c)",
    cardBg: "rgba(255,255,255,0.93)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  bordo_kurumsal: {
    id: "bordo_kurumsal",
    ad: "Bordo Kurumsal",
    primary: "#6d2e46",
    primaryDark: "#4a1f30",
    accent: "#d4a574",
    accentSoft: "#f5ebe0",
    surface: "#fdf8f6",
    text: "#2d1f24",
    textMuted: "#6d5c63",
    skyGradient: "linear-gradient(160deg, #a8556f 0%, #6d2e46 60%, #4a1f30 100%)",
    footerBg: "linear-gradient(90deg, #4a1f30, #6d2e46)",
    cardBg: "rgba(255,255,255,0.96)",
    fontFamily: "Georgia, serif",
  },
  mor_premium: {
    id: "mor_premium",
    ad: "Mor Premium",
    primary: "#5b21b6",
    primaryDark: "#3b0764",
    accent: "#e9d5ff",
    accentSoft: "#f3e8ff",
    surface: "#faf5ff",
    text: "#1e1b4b",
    textMuted: "#6b7280",
    skyGradient: "linear-gradient(165deg, #a78bfa 0%, #7c3aed 50%, #5b21b6 100%)",
    footerBg: "linear-gradient(90deg, #3b0764, #5b21b6)",
    cardBg: "rgba(255,255,255,0.94)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
};

export function temaSec(tarz: AfisTarzi, tur: AfisTuru): AfisTemaId {
  if (tur === "yaz_kampi" || tarz === "enerjik") return "gokyuzu";
  if (tarz === "kurumsal" || tarz === "klasik") return "lacivert_altin";
  if (tarz === "premium") return "mor_premium";
  if (tarz === "cocuk_dostu") return "yesil_umut";
  if (tarz === "sade") return "bordo_kurumsal";
  if (tur === "kayit_on_kayit") return "turuncu_enerji";
  return "gokyuzu";
}

export function temaAl(id: AfisTemaId): AfisTema {
  return AFIS_TEMALAR[id] ?? AFIS_TEMALAR.gokyuzu;
}
