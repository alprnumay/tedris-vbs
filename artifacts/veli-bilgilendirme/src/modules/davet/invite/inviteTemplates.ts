import type { ComponentType } from "react";
import type { InviteTemplateId } from "@/modules/davet/invite/inviteTemplateHelpers";
import type { InviteTemplateProps } from "@/modules/davet/invite/templates/InviteTemplates";
import {
  FotografliTemplate,
  KurumsalKlasikTemplate,
  ModernBolmeliTemplate,
  PremiumLacivertTemplate,
  QrKayitTemplate,
} from "@/modules/davet/invite/templates/InviteTemplates";

export type InviteTemplateDef = {
  id: InviteTemplateId;
  label: string;
  description: string;
  Component: ComponentType<InviteTemplateProps>;
};

export const INVITE_TEMPLATES: InviteTemplateDef[] = [
  {
    id: "kurumsal-klasik",
    label: "Kurumsal Klasik",
    description: "Temiz zemin, ince çizgiler, premium kurumsal düzen",
    Component: KurumsalKlasikTemplate,
  },
  {
    id: "modern-bolmeli",
    label: "Modern Bölmeli",
    description: "Sol içerik, sağ bilgi kartları",
    Component: ModernBolmeliTemplate,
  },
  {
    id: "premium-lacivert",
    label: "Premium Lacivert",
    description: "Koyu kurumsal zemin, altın vurgular",
    Component: PremiumLacivertTemplate,
  },
  {
    id: "fotografli",
    label: "Fotoğraflı Davetiye",
    description: "Görsel destekli, okunaklı metin blokları",
    Component: FotografliTemplate,
  },
  {
    id: "qr-kayit",
    label: "QR / Kayıt Odaklı",
    description: "Kayıt QR alanı ile dengeli yerleşim",
    Component: QrKayitTemplate,
  },
];

export const DEFAULT_INVITE_TEMPLATE_ID: InviteTemplateId = "kurumsal-klasik";

export function getInviteTemplate(id: string): InviteTemplateDef {
  return INVITE_TEMPLATES.find((t) => t.id === id) ?? INVITE_TEMPLATES[0];
}

/** Eski sayısal şablon ID'lerini yeni sisteme eşler */
export function migrateLegacyInviteTemplateId(id: string): InviteTemplateId {
  const map: Record<string, InviteTemplateId> = {
    "1": "kurumsal-klasik",
    "2": "modern-bolmeli",
    "3": "premium-lacivert",
    "4": "fotografli",
    "5": "qr-kayit",
    "6": "kurumsal-klasik",
  };
  return map[id] ?? (INVITE_TEMPLATES.some((t) => t.id === id) ? (id as InviteTemplateId) : DEFAULT_INVITE_TEMPLATE_ID);
}
