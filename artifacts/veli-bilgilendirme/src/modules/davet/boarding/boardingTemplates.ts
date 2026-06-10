import type { ComponentType } from "react";
import { BOARDING_TEMPLATE_CONFIGS } from "@/modules/davet/boarding/boardingTemplateConfig";
import type { BoardingTemplateId } from "@/modules/davet/boarding/boardingTemplateHelpers";
import type { BoardingTemplateProps } from "@/modules/davet/boarding/templates/BoardingTemplates";
import {
  DavetOdakliKurumsalTemplate,
  KayitBilgilendirmeTemplate,
  ProgramOdakliPremiumTemplate,
} from "@/modules/davet/boarding/templates/BoardingTemplates";

const COMPONENTS: Record<BoardingTemplateId, ComponentType<BoardingTemplateProps>> = {
  "program-odakli-premium": ProgramOdakliPremiumTemplate,
  "davet-odakli-kurumsal": DavetOdakliKurumsalTemplate,
  "kayit-bilgilendirme": KayitBilgilendirmeTemplate,
};

export type BoardingTemplateDef = {
  id: BoardingTemplateId;
  label: string;
  description: string;
  tag: string;
  previewGradient: string;
  Component: ComponentType<BoardingTemplateProps>;
};

export const BOARDING_TEMPLATES: BoardingTemplateDef[] = BOARDING_TEMPLATE_CONFIGS.map((cfg) => ({
  ...cfg,
  Component: COMPONENTS[cfg.id],
}));

export const DEFAULT_BOARDING_TEMPLATE_ID: BoardingTemplateId = "program-odakli-premium";

export function getBoardingTemplate(id: string): BoardingTemplateDef {
  return BOARDING_TEMPLATES.find((t) => t.id === id) ?? BOARDING_TEMPLATES[0];
}

export function migrateLegacyBoardingTemplateId(id: string): BoardingTemplateId {
  const map: Record<string, BoardingTemplateId> = {
    "1": "program-odakli-premium",
    "2": "davet-odakli-kurumsal",
    "3": "kayit-bilgilendirme",
    "4": "kayit-bilgilendirme",
    "5": "davet-odakli-kurumsal",
    "6": "davet-odakli-kurumsal",
    "7": "program-odakli-premium",
    "8": "kayit-bilgilendirme",
  };
  return map[id] ?? (BOARDING_TEMPLATES.some((t) => t.id === id) ? (id as BoardingTemplateId) : DEFAULT_BOARDING_TEMPLATE_ID);
}
