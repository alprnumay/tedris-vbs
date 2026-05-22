/** Premium Kalkan — dinamik Y-offset (modern master, viewBox 720×920) */

export const SHIELD_VIEW_W = 720;
export const SHIELD_VIEW_H = 920;

export interface ModernShieldTextLayout {
  titleY1: number;
  titleY2: number;
  secondaryY: number;
  lineY: number;
  sloganY: number;
  footerY: number;
  mainTitleFontSize: number;
  subTitleFontSize: number;
}

export function computeModernShieldTextLayout(opts: {
  nameLineCount: number;
  firstLineLength: number;
  hasExtraSecondary: boolean;
  hasSlogan: boolean;
}): ModernShieldTextLayout {
  const mainTitleFontSize = opts.firstLineLength > 12 ? 42 : 48;
  const subTitleFontSize = 20;

  const titleY1 = 640;
  const titleY2 = titleY1 + 55;

  let currentY = opts.nameLineCount > 1 ? titleY2 + 45 : titleY1 + 50;

  let secondaryY = 0;
  let lineY: number;

  if (opts.hasExtraSecondary) {
    secondaryY = currentY;
    lineY = secondaryY + 25;
    currentY = lineY;
  } else {
    lineY = currentY + 15;
    currentY = lineY;
  }

  const sloganY = opts.hasSlogan ? lineY + 45 : 0;
  const footerY = opts.hasSlogan ? sloganY + 45 : lineY + 45;

  return {
    titleY1,
    titleY2,
    secondaryY,
    lineY,
    sloganY,
    footerY,
    mainTitleFontSize,
    subTitleFontSize,
  };
}

/** @deprecated Eski lacivert kalkan layout — modern şablon computeModernShieldTextLayout kullanır */
export function computeShieldTextLayout() {
  throw new Error("computeShieldTextLayout deprecated; use computeModernShieldTextLayout");
}
