/** Afiş sahnesi — form şemasından bağımsız; yalnızca önizleme / export anında kullanılır. */

import { denemeTarihEtiketi } from "@/lib/denemeOrnekVeri";
import type { DenemeSinaviFormData } from "@/types/denemeSinavi";
import { afisGorselDizisi, sinifBadgeMetni } from "@/types/denemeSinavi";

export type PlacedPieceType =
  | "title"
  | "subtitle"
  | "datetime"
  | "class_level"
  | "reward"
  | "qr"
  | "cta"
  | "contact"
  | "logo"
  | "image"
  | "free_text";

export type TextAlign = "left" | "center" | "right";

export type RewardFrameType = "none" | "rounded" | "ring";

export type TextBoxRadius = "none" | "sm" | "round";

export type FontStackId =
  | "inter"
  | "poppins"
  | "montserrat"
  | "oswald"
  | "display"
  | "georgia"
  | "arial"
  | "serif_generic"
  | "sans_generic"
  | "condensed";

export const FONT_STACK_CSS: Record<FontStackId, string> = {
  inter: 'Inter, ui-sans-serif, system-ui, sans-serif',
  poppins: 'Poppins, ui-sans-serif, system-ui, sans-serif',
  montserrat: 'Montserrat, ui-sans-serif, system-ui, sans-serif',
  oswald: 'Oswald, ui-sans-serif, system-ui, sans-serif',
  display: 'Impact, "Arial Narrow", Oswald, ui-sans-serif, system-ui, sans-serif',
  georgia: 'Georgia, "Times New Roman", Times, serif',
  arial: 'Arial, Helvetica, ui-sans-serif, sans-serif',
  serif_generic: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  sans_generic: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  condensed: '"Arial Narrow", "Franklin Gothic Medium", "Helvetica Condensed", Oswald, sans-serif',
};

export type PlacedElementStyle = {
  fontStack?: FontStackId;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  color?: string;
  textAlign?: TextAlign;
  text?: string;
  rewardTitle?: string;
  rewardDescription?: string;
  rewardImage?: string;
  frameType?: RewardFrameType;
  qrUrl?: string;
  qrCta?: string;
  qrSize?: number;
  /** Yazı kutusu — başlıkta varsayılan kapalı */
  textBgEnabled?: boolean;
  textBorderEnabled?: boolean;
  textRadius?: TextBoxRadius;
  textShadowEnabled?: boolean;
  textBoxBgColor?: string;
  textBoxBorderColor?: string;
};

export type PlacedElement = {
  id: string;
  type: PlacedPieceType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  style: PlacedElementStyle;
};

export type CanvasBackgroundState = {
  presetId: string | null;
  customImageUrl: string | null;
  /** 0.2 – 1 */
  opacity: number;
  blurPx: number;
};

export type PosterSceneState = {
  editMode: boolean;
  elements: PlacedElement[];
  selectedId: string | null;
  zCounter: number;
  canvasBackground: CanvasBackgroundState;
};

export const SCENE_DESKTOP_MIN_PX = 768;

export const SCENE_MIN_W = 12;
export const SCENE_MAX_W = 96;
export const SCENE_MIN_H = 4;
export const SCENE_MAX_H = 88;

const SNAP_ROT = [0, 15, -15, 30, -30];

export function initialPosterScene(): PosterSceneState {
  return {
    editMode: false,
    elements: [],
    selectedId: null,
    zCounter: 1,
    canvasBackground: {
      presetId: "paper-white",
      customImageUrl: null,
      opacity: 1,
      blurPx: 0,
    },
  };
}

export function newPlacedId(): string {
  return `pe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function snapRotationDeg(deg: number): number {
  let best = deg;
  let bestD = Infinity;
  for (const s of SNAP_ROT) {
    const d = Math.abs(deg - s);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  if (bestD <= 7) return best;
  return deg;
}

export function clampElementRect(
  x: number,
  y: number,
  w: number,
  h: number,
): { x: number; y: number; w: number; h: number } {
  const cw = Math.min(SCENE_MAX_W, Math.max(SCENE_MIN_W, w));
  const ch = Math.min(SCENE_MAX_H, Math.max(SCENE_MIN_H, h));
  const nx = Math.max(0, Math.min(100 - cw, x));
  const ny = Math.max(0, Math.min(100 - ch, y));
  return { x: nx, y: ny, w: cw, h: ch };
}

/** Basit merkez / kenar hizası (px tolerans, yüzde alanı). */
export function snapScenePosition(
  el: Pick<PlacedElement, "x" | "y" | "width" | "height">,
  others: PlacedElement[],
  cw: number,
  ch: number,
  tolPx = 8,
): { x: number; y: number } {
  let { x, y, width: w, height: h } = el;
  const tolX = (tolPx / cw) * 100;
  const tolY = (tolPx / ch) * 100;
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (Math.abs(cx - 50) < tolX) x = 50 - w / 2;
  if (Math.abs(cy - 50) < tolY) y = 50 - h / 2;
  for (const o of others) {
    if (Math.abs(x - o.x) < tolX) x = o.x;
    if (Math.abs(x + w - (o.x + o.width)) < tolX) x = o.x + o.width - w;
    if (Math.abs(y - o.y) < tolY) y = o.y;
    if (Math.abs(y + h - (o.y + o.height)) < tolY) y = o.y + o.height - h;
  }
  const c = clampElementRect(x, y, w, h);
  return { x: c.x, y: c.y };
}

const PIECE_DEFAULTS: Record<PlacedPieceType, { w: number; h: number; x: number; y: number }> = {
  title: { w: 88, h: 14, x: 6, y: 6 },
  subtitle: { w: 80, h: 8, x: 10, y: 22 },
  datetime: { w: 70, h: 8, x: 6, y: 32 },
  class_level: { w: 50, h: 6, x: 6, y: 42 },
  reward: { w: 88, h: 22, x: 6, y: 50 },
  qr: { w: 36, h: 20, x: 58, y: 68 },
  cta: { w: 72, h: 8, x: 14, y: 88 },
  contact: { w: 88, h: 10, x: 6, y: 78 },
  logo: { w: 88, h: 12, x: 6, y: 4 },
  image: { w: 90, h: 18, x: 5, y: 4 },
  free_text: { w: 70, h: 10, x: 10, y: 55 },
};

function textBoxDefaults(type: PlacedPieceType): Pick<
  PlacedElementStyle,
  "textBgEnabled" | "textBorderEnabled" | "textRadius" | "textShadowEnabled" | "textBoxBgColor" | "textBoxBorderColor"
> {
  if (type === "title" || type === "subtitle") {
    return {
      textBgEnabled: false,
      textBorderEnabled: false,
      textRadius: "sm",
      textShadowEnabled: false,
      textBoxBgColor: "rgba(255,255,255,0.92)",
      textBoxBorderColor: "rgba(15,23,42,0.2)",
    };
  }
  if (type === "class_level" || type === "datetime") {
    return {
      textBgEnabled: true,
      textBorderEnabled: true,
      textRadius: "round",
      textShadowEnabled: false,
      textBoxBgColor: "rgba(255,255,255,0.2)",
      textBoxBorderColor: "rgba(255,255,255,0.35)",
    };
  }
  return {
    textBgEnabled: false,
    textBorderEnabled: false,
    textRadius: "sm",
    textShadowEnabled: false,
    textBoxBgColor: "rgba(255,255,255,0.85)",
    textBoxBorderColor: "rgba(15,23,42,0.25)",
  };
}

export function defaultPieceForType(
  type: PlacedPieceType,
  z: number,
  dropXPct: number,
  dropYPct: number,
): PlacedElement {
  const d = PIECE_DEFAULTS[type];
  const { x, y, w, h } = clampElementRect(dropXPct - d.w / 2, dropYPct - d.h / 2, d.w, d.h);
  const box = textBoxDefaults(type);
  const baseText: PlacedElementStyle = {
    fontStack: type === "title" || type === "subtitle" ? "display" : "inter",
    fontSize: type === "title" ? 18 : type === "subtitle" ? 12 : 11,
    fontWeight: type === "title" ? "bold" : "normal",
    color: "#0f172a",
    textAlign: "center",
    frameType: "rounded",
    ...box,
  };
  return {
    id: newPlacedId(),
    type,
    x,
    y,
    width: w,
    height: h,
    rotation: 0,
    zIndex: z,
    locked: false,
    style: baseText,
  };
}

/** Çakışmaları azaltan basit yerleşim düzeltici. */
export function autoFixSceneLayout(elements: PlacedElement[]): PlacedElement[] {
  const sorted = [...elements].sort((a, b) => {
    const order = (t: PlacedPieceType) =>
      ["logo", "image", "title", "subtitle", "datetime", "class_level", "reward", "cta", "qr", "contact", "free_text"].indexOf(t);
    return order(a.type) - order(b.type);
  });
  let y = 4;
  const out: PlacedElement[] = [];
  for (const e of sorted) {
    const w = Math.min(e.width, 92);
    const h = Math.min(Math.max(e.height, SCENE_MIN_H), 28);
    const row = clampElementRect(4, y, w, h);
    out.push({ ...e, x: row.x, y: row.y, width: row.w, height: row.h, rotation: 0 });
    y += row.h + 2;
    if (y > 92) y = 4;
  }
  const bottom = out.filter((e) => e.type === "qr" || e.type === "contact" || e.type === "cta");
  const rest = out.filter((e) => !bottom.includes(e));
  let by = 70;
  const placedBottom: PlacedElement[] = bottom.map((e) => {
    const c = clampElementRect(e.type === "qr" ? 58 : 6, by, e.width, e.height);
    by += c.h + 2;
    return { ...e, x: c.x, y: c.y, width: c.w, height: c.h, rotation: 0 };
  });
  return [...rest, ...placedBottom].map((e, i) => ({ ...e, zIndex: i + 1 }));
}

export const PIECE_PALETTE: { type: PlacedPieceType; label: string }[] = [
  { type: "title", label: "Başlık" },
  { type: "subtitle", label: "Alt başlık" },
  { type: "datetime", label: "Tarih / Saat" },
  { type: "class_level", label: "Sınıf seviyesi" },
  { type: "reward", label: "Ödül kartı" },
  { type: "qr", label: "QR / Kayıt" },
  { type: "cta", label: "CTA butonu" },
  { type: "contact", label: "İletişim" },
  { type: "logo", label: "Logo" },
  { type: "image", label: "Görsel" },
  { type: "free_text", label: "Serbest yazı" },
];

const TEXT_TYPES: PlacedPieceType[] = ["title", "subtitle", "datetime", "class_level", "free_text", "contact"];

export function pieceSupportsTextChrome(type: PlacedPieceType): boolean {
  return TEXT_TYPES.includes(type);
}

/** Otomatik şablondaki verilerle sahne öğeleri üret (yüzde konumlar). */
export function buildSceneFromFormData(data: DenemeSinaviFormData): { elements: PlacedElement[]; zCounter: number } {
  const elements: PlacedElement[] = [];
  let zc = 0;
  const push = (partial: Omit<PlacedElement, "id" | "locked" | "rotation" | "zIndex">) => {
    zc++;
    elements.push({
      ...partial,
      id: newPlacedId(),
      zIndex: zc,
      locked: false,
      rotation: 0,
    });
  };

  push({
    type: "logo",
    x: 6,
    y: 2,
    width: 88,
    height: 10,
    style: { ...textBoxDefaults("logo"), fontSize: 11, color: "#0f172a", textAlign: "left" },
  });

  push({
    type: "title",
    x: 6,
    y: 12,
    width: 88,
    height: 12,
    style: {
      ...textBoxDefaults("title"),
      text: data.baslik,
      fontStack: "display",
      fontSize: 20,
      fontWeight: "bold",
      color: "#0f172a",
      textAlign: "center",
    },
  });

  const sub = data.duyuruMetni.trim().slice(0, 160) || "Alt başlık";
  push({
    type: "subtitle",
    x: 8,
    y: 25,
    width: 84,
    height: 8,
    style: { ...textBoxDefaults("subtitle"), text: sub, fontSize: 11, color: "#334155", textAlign: "center" },
  });

  push({
    type: "datetime",
    x: 6,
    y: 34,
    width: 88,
    height: 7,
    style: {
      ...textBoxDefaults("datetime"),
      fontSize: 11,
      color: "#1e293b",
      textAlign: "center",
      text: `${data.tarih ? denemeTarihEtiketi(data.tarih) : "—"}${data.saat ? ` · ${data.saat}` : ""}`,
    },
  });

  push({
    type: "class_level",
    x: 6,
    y: 42,
    width: 48,
    height: 6,
    style: {
      ...textBoxDefaults("class_level"),
      fontSize: 10,
      fontWeight: "bold",
      color: "#0f172a",
      text: sinifBadgeMetni(data),
    },
  });

  const first = data.oduller[0];
  push({
    type: "reward",
    x: 6,
    y: 49,
    width: 88,
    height: 22,
    style: {
      frameType: "rounded",
      rewardTitle: first?.title ?? "Ödül",
      rewardDescription: first?.description,
      rewardImage: first?.image,
      fontSize: 11,
      color: "#0f172a",
    },
  });

  const urls = afisGorselDizisi(data);
  if (urls[0]) {
    push({
      type: "image",
      x: 6,
      y: 72,
      width: 88,
      height: 16,
      style: {},
    });
  }

  push({
    type: "cta",
    x: 10,
    y: 88,
    width: 76,
    height: 8,
    style: { text: "Hemen başvur", fontSize: 12, fontWeight: "bold", color: "#0f172a" },
  });

  push({
    type: "qr",
    x: 58,
    y: 68,
    width: 34,
    height: 18,
    style: {
      qrUrl: data.kayitQrUrl,
      qrCta: "QR Tara · Kayıt",
      qrSize: 64,
      fontSize: 9,
      color: "#0f172a",
    },
  });

  const contactLines = [data.telefon, data.adres].filter(Boolean).join("\n");
  push({
    type: "contact",
    x: 6,
    y: 78,
    width: 50,
    height: 10,
    style: {
      ...textBoxDefaults("contact"),
      text: contactLines || "İletişim",
      fontSize: 9,
      color: "#1e293b",
      textAlign: "left",
    },
  });

  const fixed = autoFixSceneLayout(elements);
  return { elements: fixed, zCounter: fixed.length };
}
