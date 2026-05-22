import type { YatiliArkaPlanId, YatiliAfishSablonu } from "@/types/yatiliProgram";
import type { YatiliPosterTema } from "./yatiliTema";

export type ArkaPlanTanim = {
  id: YatiliArkaPlanId;
  ad: string;
  /** Ana zemin + dekor katmanı */
  zemin: (tema: YatiliPosterTema, dark?: boolean) => string;
  dekor?: (tema: YatiliPosterTema) => string;
};

export const ARKA_PLANLAR: Record<YatiliArkaPlanId, ArkaPlanTanim> = {
  krem_doku: {
    id: "krem_doku",
    ad: "Yumuşak krem dokulu",
    zemin: (t) =>
      `radial-gradient(ellipse 120% 80% at 50% 0%, ${t.accentSoft}88 0%, transparent 55%), ${t.cream}`,
    dekor: (t) =>
      `repeating-linear-gradient(0deg, transparent, transparent 28px, ${t.primary}06 28px, ${t.primary}06 29px)`,
  },
  gece_doku: {
    id: "gece_doku",
    ad: "Lacivert gece dokusu",
    zemin: (t) => t.nightGradient,
    dekor: () =>
      "radial-gradient(ellipse 70% 40% at 80% 10%, rgba(255,255,255,0.08), transparent), radial-gradient(ellipse 50% 30% at 10% 90%, rgba(201,162,39,0.12), transparent)",
  },
  geometrik: {
    id: "geometrik",
    ad: "Enerjik geometrik",
    zemin: (t) => `linear-gradient(135deg, ${t.cream} 0%, ${t.accentSoft} 100%)`,
    dekor: (t) =>
      `linear-gradient(135deg, transparent 40%, ${t.primary}12 40%, ${t.primary}12 42%, transparent 42%), linear-gradient(45deg, transparent 60%, ${t.accent}18 60%)`,
  },
  sicak_gradient: {
    id: "sicak_gradient",
    ad: "Sıcak gradient",
    zemin: (t) => `linear-gradient(165deg, ${t.accentSoft} 0%, ${t.cream} 45%, ${t.accentSoft}99 100%)`,
    dekor: (t) => `radial-gradient(circle at 20% 30%, ${t.primary}10 0%, transparent 40%)`,
  },
  kurumsal_desen: {
    id: "kurumsal_desen",
    ad: "Hafif kurumsal desen",
    zemin: (t) => t.cream,
    dekor: (t) =>
      `repeating-linear-gradient(135deg, ${t.primary}07 0 2px, transparent 2px 14px), linear-gradient(180deg, ${t.primary}08, transparent 30%)`,
  },
  premium_gorselsiz: {
    id: "premium_gorselsiz",
    ad: "Görselsiz premium",
    zemin: (t) => `linear-gradient(160deg, ${t.primaryDark} 0%, ${t.primary} 35%, ${t.primaryDark} 100%)`,
    dekor: () =>
      "radial-gradient(ellipse 90% 50% at 50% 20%, rgba(255,255,255,0.12), transparent), linear-gradient(0deg, rgba(0,0,0,0.15), transparent 40%)",
  },
};

export function sablonArkaPlanOnerileri(sablon: YatiliAfishSablonu): YatiliArkaPlanId[] {
  const map: Record<YatiliAfishSablonu, YatiliArkaPlanId[]> = {
    hero_invite: ["sicak_gradient", "geometrik", "krem_doku"],
    program_flow: ["krem_doku", "kurumsal_desen", "sicak_gradient"],
    night_theme: ["gece_doku", "premium_gorselsiz", "sicak_gradient"],
    trust_focused: ["krem_doku", "kurumsal_desen", "premium_gorselsiz"],
  };
  return map[sablon];
}

export function arkaPlanStil(id: YatiliArkaPlanId, tema: YatiliPosterTema, dark?: boolean): { zemin: string; dekor?: string } {
  const t = ARKA_PLANLAR[id] ?? ARKA_PLANLAR.krem_doku;
  return { zemin: t.zemin(tema, dark), dekor: t.dekor?.(tema) };
}
