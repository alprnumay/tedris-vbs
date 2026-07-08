import type { CSSProperties, ReactNode } from "react";
import type { FormData } from "@/types";
import { baslikolustur } from "@/lib/dil";
import {
  POSTER_BODY_CLS,
  POSTER_FOOTER_CLS,
  POSTER_SHELL_CLS,
  posterBodyStyle,
  posterFooterStyle,
  posterShellStyle,
} from "./posterShell";
import { calculateDescriptionClamp, calculateTitleSize, templatePhotoStyle } from "./templateLayoutEngine";

export interface TemplateProps {
  form: FormData;
  tarih: string;
}

export function activeFaaliyetler(form: FormData) {
  return form.faaliyetler.slice(0, form.faaliyetSayisi).filter((f) => f.tur || f.alan || f.ozelNot);
}

export function posterBaslik(form: FormData) {
  return baslikolustur(form);
}

export function clampMetin(text: string, max = 520) {
  const t = (text || "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function PosterImg({
  src,
  height = 120,
  radius = 10,
  style,
}: {
  src: string;
  height?: number | string;
  radius?: number;
  style?: CSSProperties;
}) {
  return (
    <img
      src={src}
      alt=""
      style={{
        ...templatePhotoStyle({ height, radius }),
        width: "100%",
        display: "block",
        ...style,
      }}
    />
  );
}

export function EmptyPhotoSlot({
  label = "Görsel alanı",
  height = 88,
  accent = "#64748b",
}: {
  label?: string;
  height?: number;
  accent?: string;
}) {
  return (
    <div
      style={{
        height,
        borderRadius: 10,
        border: `1.5px dashed ${accent}55`,
        background: `${accent}10`,
        display: "grid",
        placeItems: "center",
        fontSize: 10,
        fontWeight: 700,
        color: accent,
        textAlign: "center",
        padding: 8,
      }}
    >
      {label}
    </div>
  );
}

export function TemplateShell({
  children,
  style,
  className = POSTER_SHELL_CLS,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div className={className} style={{ ...posterShellStyle, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", ...style }}>
      {children}
    </div>
  );
}

export function TemplateBody({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={POSTER_BODY_CLS} style={{ ...posterBodyStyle, ...style }}>
      {children}
    </div>
  );
}

export function TemplateFooter({
  form,
  tarih,
  dark = false,
  accent = "#2563eb",
}: {
  form: FormData;
  tarih: string;
  dark?: boolean;
  accent?: string;
}) {
  const sub = dark ? "rgba(255,255,255,.65)" : "#64748b";
  return (
    <div
      className={POSTER_FOOTER_CLS}
      style={{
        ...posterFooterStyle,
        borderTop: `1px solid ${dark ? "rgba(255,255,255,.14)" : "#e2e8f0"}`,
        paddingTop: 12,
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        alignItems: "flex-end",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: dark ? "#fff" : "#0f172a" }}>{form.isim || "Sorumlu"}</div>
        <div style={{ fontSize: 10, color: sub }}>{form.rol || "Kurum Sorumlusu"}</div>
      </div>
      <div style={{ textAlign: "right", minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: accent }}>{form.kurumAdi || "Kurum"}</div>
        <div style={{ fontSize: 10, color: sub }}>{tarih}</div>
      </div>
    </div>
  );
}

export function TitleBlock({
  form,
  baslik,
  accent,
  dark,
  size = 24,
}: {
  form: FormData;
  baslik: string;
  accent: string;
  dark?: boolean;
  size?: number;
}) {
  return (
    <>
      <h1
        data-template-title
        style={{
          ...calculateTitleSize(baslik, { base: size }),
          margin: "0 0 6px",
          fontWeight: 900,
          color: dark ? "#fff" : "#0f172a",
        }}
      >
        {baslik}
      </h1>
      {form.kurumAdi ? (
        <div style={{ fontSize: 11, fontWeight: 800, color: accent, marginBottom: 8 }}>{form.kurumAdi}</div>
      ) : null}
    </>
  );
}

export function DescBlock({
  text,
  fontSize = 12.5,
  maxLines = 6,
  color = "#334155",
}: {
  text: string;
  fontSize?: number;
  maxLines?: number;
  color?: string;
}) {
  return (
    <p
      data-template-description
      style={{
        ...calculateDescriptionClamp(text, { fontSize, maxLines }),
        margin: 0,
        color,
      }}
    >
      {text}
    </p>
  );
}
