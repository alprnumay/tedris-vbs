import type { CSSProperties } from "react";

/** Sabit afiş tuvali — tüm şablonlar bu ölçüye uyar. */
export const VELI_POSTER_W = 520;
export const VELI_POSTER_H = 720;

export const POSTER_SHELL_CLS = "veli-poster-template-shell";
export const POSTER_HEADER_CLS = "veli-poster-template-header";
export const POSTER_BODY_CLS = "veli-poster-template-body";
export const POSTER_FOOTER_CLS = "veli-poster-template-footer";

/** Template root — artboard'un tamamını doldurur. */
export const posterShellStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: "100%",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
};

export const posterHeaderStyle: CSSProperties = {
  flexShrink: 0,
  overflow: "visible",
  minHeight: "auto",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
};

export const posterBodyStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

export const posterFooterStyle: CSSProperties = {
  marginTop: "auto",
  flexShrink: 0,
};
