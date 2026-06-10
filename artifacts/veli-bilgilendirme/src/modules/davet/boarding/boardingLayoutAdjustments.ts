import type { CSSProperties } from "react";
import type { BoardingTemplateId } from "@/modules/davet/boarding/boardingTemplateHelpers";

export type BoardingLayerId =
  | "title"
  | "description"
  | "institution"
  | "date"
  | "time"
  | "place"
  | "classLevel"
  | "capacity"
  | "flowBlock"
  | "requirementsBlock"
  | "noteBlock"
  | "qrBlock"
  | "contactBlock"
  | "logo"
  | "image";

export type BoardingLayerAdjustment = {
  x: number;
  y: number;
  fontSize?: number;
  width?: number;
  align?: "left" | "center" | "right";
};

export type BoardingTemplateAdjustments = Partial<Record<BoardingLayerId, BoardingLayerAdjustment>>;
export type BoardingCustomAdjustments = Partial<Record<BoardingTemplateId, BoardingTemplateAdjustments>>;

export const BOARDING_LAYER_LABELS: Record<BoardingLayerId, string> = {
  title: "Başlık",
  description: "Açıklama",
  institution: "Kurum Adı",
  date: "Tarih",
  time: "Saat",
  place: "Yer",
  classLevel: "Sınıf",
  capacity: "Kontenjan",
  flowBlock: "Program Akışı",
  requirementsBlock: "Gereksinimler",
  noteBlock: "Not / Güven Mesajı",
  qrBlock: "QR",
  contactBlock: "İletişim",
  logo: "Logo",
  image: "Görsel",
};

export const BOARDING_ADJ_LIMITS = {
  fontSize: { min: 12, max: 72 },
  x: { min: -280, max: 280 },
  y: { min: -180, max: 180 },
  width: { min: 150, max: 880 },
} as const;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function clampBoardingAdjustment(adj: Partial<BoardingLayerAdjustment>): BoardingLayerAdjustment {
  return {
    x: clamp(adj.x ?? 0, BOARDING_ADJ_LIMITS.x.min, BOARDING_ADJ_LIMITS.x.max),
    y: clamp(adj.y ?? 0, BOARDING_ADJ_LIMITS.y.min, BOARDING_ADJ_LIMITS.y.max),
    fontSize: adj.fontSize !== undefined ? clamp(adj.fontSize, BOARDING_ADJ_LIMITS.fontSize.min, BOARDING_ADJ_LIMITS.fontSize.max) : undefined,
    width: adj.width !== undefined ? clamp(adj.width, BOARDING_ADJ_LIMITS.width.min, BOARDING_ADJ_LIMITS.width.max) : undefined,
    align: adj.align,
  };
}

export function isBoardingAdjustmentActive(adj?: BoardingLayerAdjustment): boolean {
  if (!adj) return false;
  return adj.x !== 0 || adj.y !== 0 || adj.fontSize !== undefined || adj.width !== undefined || adj.align !== undefined;
}

export function buildBoardingLayerStyle(adj?: BoardingLayerAdjustment): CSSProperties {
  if (!adj || !isBoardingAdjustmentActive(adj)) return {};
  const s: CSSProperties = {};
  if (adj.x || adj.y) s.transform = `translate(${adj.x}px, ${adj.y}px)`;
  if (adj.fontSize) s.fontSize = adj.fontSize;
  if (adj.width) {
    s.width = adj.width;
    s.maxWidth = adj.width;
  }
  if (adj.align) s.textAlign = adj.align;
  return s;
}
