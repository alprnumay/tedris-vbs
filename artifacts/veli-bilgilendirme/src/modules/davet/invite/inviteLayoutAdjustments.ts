import type { CSSProperties } from "react";
import type { InviteTemplateId } from "@/modules/davet/invite/inviteTemplateHelpers";

export type TextLayerId =
  | "institution"
  | "title"
  | "description"
  | "student"
  | "date"
  | "time"
  | "place"
  | "note"
  | "contact"
  | "qrCaption";

export type TextLayerAdjustment = {
  x: number;
  y: number;
  fontSize?: number;
  width?: number;
  align?: "left" | "center" | "right";
  lineHeight?: number;
  fontWeight?: 400 | 500 | 600 | 700;
};

export type TemplateLayoutAdjustments = Partial<Record<TextLayerId, TextLayerAdjustment>>;
export type CustomLayoutAdjustments = Partial<Record<InviteTemplateId, TemplateLayoutAdjustments>>;

export const TEXT_LAYER_LABELS: Record<TextLayerId, string> = {
  institution: "Kurum Adı",
  title: "Başlık",
  description: "Açıklama",
  student: "Veli / Öğrenci",
  date: "Tarih",
  time: "Saat",
  place: "Yer",
  note: "Katılım Notu",
  contact: "İletişim",
  qrCaption: "QR Açıklama",
};

export const ADJUSTMENT_LIMITS = {
  fontSize: { min: 12, max: 72, step: 1 },
  x: { min: -300, max: 300, step: 1 },
  y: { min: -200, max: 200, step: 1 },
  width: { min: 150, max: 900, step: 10 },
  lineHeight: { min: 0.9, max: 1.6, step: 0.05 },
} as const;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function clampAdjustment(adj: Partial<TextLayerAdjustment>): TextLayerAdjustment {
  return {
    x: clamp(adj.x ?? 0, ADJUSTMENT_LIMITS.x.min, ADJUSTMENT_LIMITS.x.max),
    y: clamp(adj.y ?? 0, ADJUSTMENT_LIMITS.y.min, ADJUSTMENT_LIMITS.y.max),
    fontSize:
      adj.fontSize !== undefined
        ? clamp(adj.fontSize, ADJUSTMENT_LIMITS.fontSize.min, ADJUSTMENT_LIMITS.fontSize.max)
        : undefined,
    width:
      adj.width !== undefined
        ? clamp(adj.width, ADJUSTMENT_LIMITS.width.min, ADJUSTMENT_LIMITS.width.max)
        : undefined,
    align: adj.align,
    lineHeight:
      adj.lineHeight !== undefined
        ? clamp(adj.lineHeight, ADJUSTMENT_LIMITS.lineHeight.min, ADJUSTMENT_LIMITS.lineHeight.max)
        : undefined,
    fontWeight: adj.fontWeight,
  };
}

export function isAdjustmentActive(adj?: TextLayerAdjustment): boolean {
  if (!adj) return false;
  return (
    adj.x !== 0 ||
    adj.y !== 0 ||
    adj.fontSize !== undefined ||
    adj.width !== undefined ||
    adj.align !== undefined ||
    adj.lineHeight !== undefined ||
    adj.fontWeight !== undefined
  );
}

export function mergeLayerAdjustment(
  base?: TextLayerAdjustment,
  patch?: Partial<TextLayerAdjustment>,
): TextLayerAdjustment {
  return clampAdjustment({ ...base, ...patch });
}

export function buildLayerStyle(adj?: TextLayerAdjustment): CSSProperties {
  if (!adj || !isAdjustmentActive(adj)) return {};
  const style: CSSProperties = {};
  if (adj.x !== 0 || adj.y !== 0) {
    style.transform = `translate(${adj.x}px, ${adj.y}px)`;
  }
  if (adj.fontSize !== undefined) style.fontSize = adj.fontSize;
  if (adj.width !== undefined) {
    style.width = adj.width;
    style.maxWidth = adj.width;
  }
  if (adj.align) style.textAlign = adj.align;
  if (adj.lineHeight !== undefined) style.lineHeight = adj.lineHeight;
  if (adj.fontWeight !== undefined) style.fontWeight = adj.fontWeight;
  return style;
}
