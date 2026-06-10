import type { InviteTemplateId } from "@/modules/davet/invite/inviteTemplateHelpers";

export type InviteTemplateTokens = {
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
  frame: string;
};

export type InviteTemplateConfig = {
  id: InviteTemplateId;
  label: string;
  description: string;
  previewGradient: string;
  tokens: InviteTemplateTokens;
};

export const INVITE_TEMPLATE_CONFIGS: InviteTemplateConfig[] = [
  {
    id: "kurumsal-davet",
    label: "Kurumsal Davet",
    description: "Resmi, temiz ve güven veren kurumsal düzen",
    previewGradient: "linear-gradient(90deg, #f8fafc 0%, #f8fafc 70%, #1e3a8a 70%, #1e3a8a 100%)",
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
      frame: "#1e3a8a",
    },
  },
  {
    id: "premium-lacivert",
    label: "Premium Lacivert",
    description: "Koyu zemin, altın vurgu, ağırbaşlı afiş",
    previewGradient: "linear-gradient(135deg, #0b1f3a 0%, #122847 55%, #c9a227 100%)",
    tokens: {
      canvas: "#0b1f3a",
      accent: "#d4af37",
      accentSoft: "rgba(212,175,55,0.15)",
      title: "#faf8f2",
      body: "#cbd5e1",
      institution: "#d4af37",
      metaLabel: "rgba(255,255,255,0.55)",
      metaValue: "#ffffff",
      cardBg: "rgba(255,255,255,0.08)",
      cardBorder: "rgba(255,255,255,0.14)",
      frame: "#d4af37",
    },
  },
  {
    id: "gorselli-davet",
    label: "Görselli Davet",
    description: "Görsel destekli, okunaklı kart düzeni",
    previewGradient: "linear-gradient(90deg, #334155 0%, #64748b 45%, #f8fafc 45%, #f8fafc 100%)",
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
      frame: "#1e40af",
    },
  },
];

export function getInviteTemplateConfig(id: InviteTemplateId): InviteTemplateConfig {
  return INVITE_TEMPLATE_CONFIGS.find((c) => c.id === id) ?? INVITE_TEMPLATE_CONFIGS[0];
}
