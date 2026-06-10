import type { ComponentType } from "react";
import type { InviteTemplateId } from "@/modules/davet/invite/inviteTemplateHelpers";
import { INVITE_TEMPLATE_CONFIGS } from "@/modules/davet/invite/inviteTemplateConfig";
import type { InviteTemplateProps } from "@/modules/davet/invite/templates/InviteTemplates";
import {
  GorselliDavetTemplate,
  KurumsalDavetTemplate,
  PremiumLacivertTemplate,
} from "@/modules/davet/invite/templates/InviteTemplates";

export type InviteTemplateDef = {
  id: InviteTemplateId;
  label: string;
  description: string;
  previewGradient: string;
  Component: ComponentType<InviteTemplateProps>;
};

export const INVITE_TEMPLATES: InviteTemplateDef[] = [
  {
    id: "kurumsal-davet",
    label: "Kurumsal Davet",
    description: "Resmi, temiz ve güven veren kurumsal düzen",
    previewGradient: INVITE_TEMPLATE_CONFIGS[0].previewGradient,
    Component: KurumsalDavetTemplate,
  },
  {
    id: "premium-lacivert",
    label: "Premium Lacivert",
    description: "Koyu zemin, altın vurgu, ağırbaşlı afiş",
    previewGradient: INVITE_TEMPLATE_CONFIGS[1].previewGradient,
    Component: PremiumLacivertTemplate,
  },
  {
    id: "gorselli-davet",
    label: "Görselli Davet",
    description: "Görsel destekli, okunaklı kart düzeni",
    previewGradient: INVITE_TEMPLATE_CONFIGS[2].previewGradient,
    Component: GorselliDavetTemplate,
  },
];

export const DEFAULT_INVITE_TEMPLATE_ID: InviteTemplateId = "kurumsal-davet";

export function getInviteTemplate(id: string): InviteTemplateDef {
  return INVITE_TEMPLATES.find((t) => t.id === id) ?? INVITE_TEMPLATES[0];
}

/** Eski şablon ID'lerini yeni 3 şablona eşler */
export function migrateLegacyInviteTemplateId(id: string): InviteTemplateId {
  const map: Record<string, InviteTemplateId> = {
    "1": "kurumsal-davet",
    "2": "kurumsal-davet",
    "3": "premium-lacivert",
    "4": "gorselli-davet",
    "5": "gorselli-davet",
    "6": "kurumsal-davet",
    "kurumsal-klasik": "kurumsal-davet",
    "modern-bolmeli": "kurumsal-davet",
    "premium-lacivert": "premium-lacivert",
    "fotografli": "gorselli-davet",
    "qr-kayit": "gorselli-davet",
  };
  return map[id] ?? (INVITE_TEMPLATES.some((t) => t.id === id) ? (id as InviteTemplateId) : DEFAULT_INVITE_TEMPLATE_ID);
}
