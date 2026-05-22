import type { ReactNode } from "react";
import { EmblemAbstractFlame, EmblemCorporateCrest, EmblemGeometricBook } from "./logoEmblemPieces";

export interface ShieldAsset {
  id: string;
  name: string;
  path: string;
}

export interface EmblemAsset {
  id: string;
  name: string;
  render: (goldGradientId: string, bg: string) => ReactNode;
}

export const LOGO_SHIELDS: ShieldAsset[] = [
  {
    id: "shield_luxury_curved",
    name: "Asil Kavisli Kalkan",
    path: "M360 60 C440 90 510 110 560 140 L535 410 C515 510 445 580 360 630 C275 580 205 510 185 410 L160 140 C210 110 280 90 360 60 Z",
  },
  {
    id: "shield_modern_sharp",
    name: "Modern Keskin Kalkan",
    path: "M360 60 L560 130 L530 420 L360 635 L190 420 L160 130 Z",
  },
  {
    id: "shield_ivy_league",
    name: "Akademik Hanedan Kalkanı",
    path: "M360 60 L550 60 L550 380 C550 510 450 610 360 640 C270 610 170 510 170 380 L170 60 Z",
  },
];

export const LOGO_EMBLEMS: EmblemAsset[] = [
  {
    id: "emblem_abstract_flame",
    name: "Soyut Bilgi Meşalesi",
    render: (goldGradientId, bg) => <EmblemAbstractFlame goldGradientId={goldGradientId} bg={bg} />,
  },
  {
    id: "emblem_geometric_book",
    name: "Minimalist Eğitim Kanatları",
    render: (goldGradientId, bg) => <EmblemGeometricBook goldGradientId={goldGradientId} bg={bg} />,
  },
  {
    id: "emblem_corporate_crest",
    name: "Yükselen Başarı Logosu",
    render: (goldGradientId, bg) => <EmblemCorporateCrest goldGradientId={goldGradientId} bg={bg} />,
  },
];

export const DEFAULT_SHIELD_ID = LOGO_SHIELDS[0].id;
export const DEFAULT_EMBLEM_ID = LOGO_EMBLEMS[0].id;

export function shieldById(id: string | undefined): ShieldAsset {
  return LOGO_SHIELDS.find((s) => s.id === id) ?? LOGO_SHIELDS[0];
}

export function emblemById(id: string | undefined): EmblemAsset {
  return LOGO_EMBLEMS.find((e) => e.id === id) ?? LOGO_EMBLEMS[0];
}
