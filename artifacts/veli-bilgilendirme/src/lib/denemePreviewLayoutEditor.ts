export type ElementType = "title" | "reward" | "qr" | "button" | "image";

export type LayoutElement = {
  id: string;
  type: ElementType;
  /** Sol üst X (poster genişliğine göre %) */
  x: number;
  y: number;
  width: number;
  height: number;
  locked?: boolean;
};

export type LayoutElementMap = Record<ElementType, LayoutElement>;

const SNAP_PX = 8;

export const LAYOUT_EDITOR_BREAKPOINT_PX = 768;

export function defaultLayoutElements(): LayoutElementMap {
  return {
    image: { id: "image", type: "image", x: 4, y: 2, width: 92, height: 16, locked: false },
    title: { id: "title", type: "title", x: 4, y: 19, width: 92, height: 20, locked: false },
    reward: { id: "reward", type: "reward", x: 4, y: 40, width: 92, height: 30, locked: false },
    qr: { id: "qr", type: "qr", x: 58, y: 68, width: 38, height: 22, locked: false },
    button: { id: "button", type: "button", x: 10, y: 88, width: 80, height: 10, locked: false },
  };
}

export function clampLayoutRect(
  x: number,
  y: number,
  w: number,
  h: number,
): { x: number; y: number } {
  const nx = Math.max(0, Math.min(100 - w, x));
  const ny = Math.max(0, Math.min(100 - h, y));
  return { x: nx, y: ny };
}

function near(a: number, b: number, tol: number): boolean {
  return Math.abs(a - b) <= tol;
}

/** Poster merkezine ve diğer kutuların kenarlarına yakınsa yapıştır (8px tolerans). */
export function snapLayoutPosition(
  dragging: LayoutElement,
  others: LayoutElement[],
  containerW: number,
  containerH: number,
): { x: number; y: number } {
  let { x, y, width: w, height: h } = dragging;
  const tolX = (SNAP_PX / Math.max(containerW, 1)) * 100;
  const tolY = (SNAP_PX / Math.max(containerH, 1)) * 100;

  const cx = x + w / 2;
  const cy = y + h / 2;
  if (near(cx, 50, tolX)) x = 50 - w / 2;
  if (near(cy, 50, tolY)) y = 50 - h / 2;

  for (const o of others) {
    if (o.id === dragging.id) continue;
    if (near(x, o.x, tolX)) x = o.x;
    if (near(x + w, o.x + o.width, tolX)) x = o.x + o.width - w;
    if (near(x + w / 2, o.x + o.width / 2, tolX)) x = o.x + o.width / 2 - w / 2;
    if (near(y, o.y, tolY)) y = o.y;
    if (near(y + h, o.y + o.height, tolY)) y = o.y + o.height - h;
    if (near(y + h / 2, o.y + o.height / 2, tolY)) y = o.y + o.height / 2 - h / 2;
  }

  return clampLayoutRect(x, y, w, h);
}

/** Basit görsel vurgu: konuma göre sınıf (orta büyük, kenar küçük, alt sade). */
export function layoutZoneAccentClass(el: LayoutElement): string {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const centerBand = cx >= 38 && cx <= 62 && cy >= 30 && cy <= 70;
  const edge = el.x <= 6 || el.x + el.width >= 94;
  const bottom = el.y >= 72;
  if (centerBand) return "scale-[1.03] sm:scale-105";
  if (edge) return "scale-[0.97] sm:scale-95";
  if (bottom) return "opacity-[0.96] saturate-[0.95]";
  return "";
}
