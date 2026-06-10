import type { BoardingTemplateId } from "@/modules/davet/boarding/boardingTemplateHelpers";

export type BoardingTemplateTokens = {
  canvas: string;
  accent: string;
  accentSoft: string;
  title: string;
  body: string;
  institution: string;
  metaLabel: string;
  metaValue: string;
  cardBg: string;
  cardBorder: string;
  panelBg: string;
};

export type BoardingTemplateConfig = {
  id: BoardingTemplateId;
  label: string;
  description: string;
  tag: string;
  previewGradient: string;
  tokens: BoardingTemplateTokens;
};

export const BOARDING_TEMPLATE_CONFIGS: BoardingTemplateConfig[] = [
  {
    id: "program-odakli-premium",
    label: "Program Odaklı Premium",
    description: "Program akışı ön planda, koyu premium afiş",
    tag: "Program odaklı",
    previewGradient: "linear-gradient(180deg, #0f172a 0%, #0f172a 55%, #d4af37 100%)",
    tokens: {
      canvas: "#0f172a",
      accent: "#d4af37",
      accentSoft: "rgba(212,175,55,0.12)",
      title: "#ffffff",
      body: "#cbd5e1",
      institution: "#d4af37",
      metaLabel: "rgba(255,255,255,0.5)",
      metaValue: "#ffffff",
      cardBg: "rgba(255,255,255,0.06)",
      cardBorder: "rgba(255,255,255,0.12)",
      panelBg: "rgba(15,23,42,0.95)",
    },
  },
  {
    id: "davet-odakli-kurumsal",
    label: "Davet Odaklı Kurumsal",
    description: "Açık zemin, güçlü tipografi, davet kartları",
    tag: "Davet odaklı",
    previewGradient: "linear-gradient(90deg, #f8fafc 0%, #f8fafc 65%, #1e3a8a 65%, #1e3a8a 100%)",
    tokens: {
      canvas: "#f8fafc",
      accent: "#1e3a8a",
      accentSoft: "#dbeafe",
      title: "#0f172a",
      body: "#475569",
      institution: "#334155",
      metaLabel: "#64748b",
      metaValue: "#0f172a",
      cardBg: "#ffffff",
      cardBorder: "#e2e8f0",
      panelBg: "#ffffff",
    },
  },
  {
    id: "kayit-bilgilendirme",
    label: "Kayıt / Bilgilendirme",
    description: "Görsel + bilgi paneli, QR ve kayıt vurgusu",
    tag: "Kayıt odaklı",
    previewGradient: "linear-gradient(90deg, #334155 0%, #64748b 42%, #f8fafc 42%, #1e40af 100%)",
    tokens: {
      canvas: "#f1f5f9",
      accent: "#1e40af",
      accentSoft: "#dbeafe",
      title: "#0f172a",
      body: "#475569",
      institution: "#334155",
      metaLabel: "#64748b",
      metaValue: "#0f172a",
      cardBg: "#ffffff",
      cardBorder: "#e2e8f0",
      panelBg: "#ffffff",
    },
  },
];

export function getBoardingTemplateConfig(id: BoardingTemplateId): BoardingTemplateConfig {
  return BOARDING_TEMPLATE_CONFIGS.find((c) => c.id === id) ?? BOARDING_TEMPLATE_CONFIGS[0];
}
