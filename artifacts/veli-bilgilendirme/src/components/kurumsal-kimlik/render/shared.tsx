import type { ReactNode } from "react";
import type { LogoConfigV1, LogoPalette } from "@/types/logoKimlik";
import { kurumAdiSatirlari, monogramHarfleri, fontFamilyAl } from "@/lib/logo/logoMetinOlculeri";

export interface PresetRenderProps {
  config: LogoConfigV1;
  uid: string;
}

export function logoUid(config: LogoConfigV1): string {
  return config.fingerprint.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || "logo";
}

export function LogoSvgRoot({
  config,
  size = 512,
  className,
  children,
}: {
  config: LogoConfigV1;
  size?: number;
  className?: string;
  children: ReactNode;
}) {
  const org = config.organization;
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={org.kurumAdi || "Logo önizleme"}
    >
      {children}
    </svg>
  );
}

export function LogoPaletteDefs({ palette, uid }: { palette: LogoPalette; uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={palette.accent} />
        <stop offset="100%" stopColor={palette.secondary} stopOpacity={0.22} />
      </linearGradient>
      <linearGradient id={`${uid}-pri`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={palette.primary} />
        <stop offset="100%" stopColor={palette.primary} stopOpacity={0.82} />
      </linearGradient>
      <linearGradient id={`${uid}-metal`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={palette.secondary} />
        <stop offset="45%" stopColor="#ffffff" stopOpacity={0.95} />
        <stop offset="55%" stopColor={palette.secondary} stopOpacity={0.7} />
        <stop offset="100%" stopColor={palette.primary} />
      </linearGradient>
      <radialGradient id={`${uid}-glow`} cx="50%" cy="40%" r="55%">
        <stop offset="0%" stopColor={palette.secondary} stopOpacity={0.35} />
        <stop offset="100%" stopColor={palette.accent} stopOpacity={0} />
      </radialGradient>
      <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor={palette.primary} floodOpacity="0.25" />
      </filter>
      <filter id={`${uid}-soft`} x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.12" />
      </filter>
    </defs>
  );
}

export function LogoBackground({ palette, uid, variant = "radial" }: { palette: LogoPalette; uid: string; variant?: "flat" | "radial" }) {
  if (variant === "flat") {
    return <rect width={512} height={512} fill={palette.accent} />;
  }
  return (
    <>
      <rect width={512} height={512} fill={`url(#${uid}-bg)`} />
      <ellipse cx={256} cy={220} rx={200} ry={180} fill={`url(#${uid}-glow)`} />
    </>
  );
}

export function KurumBaslik({
  config,
  y,
  fontSize = 32,
  fontWeight = 800,
  fill,
  maxWidth = 380,
}: {
  config: LogoConfigV1;
  y: number;
  fontSize?: number;
  fontWeight?: number;
  fill?: string;
  maxWidth?: number;
}) {
  const { organization: org, palette, variant } = config;
  const font = fontFamilyAl(variant.fontPairId);
  const lines = kurumAdiSatirlari(org.kurumAdi, 2, maxWidth > 320 ? 22 : 18);
  const scale = config.display.titleScale;
  const fs = fontSize * scale;
  const lineH = fs * 1.15;

  return (
    <>
      {lines.map((satir, i) => (
        <text
          key={i}
          x={256}
          y={y + i * lineH}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={fill ?? palette.text}
          fontFamily={font}
          fontSize={fs}
          fontWeight={fontWeight}
          letterSpacing={fontWeight >= 800 ? 0.5 : 0}
        >
          {satir}
        </text>
      ))}
    </>
  );
}

export function AltBilgiSatirlari({
  config,
  y,
  fontSize = 16,
}: {
  config: LogoConfigV1;
  y: number;
  fontSize?: number;
}) {
  const { organization: org, display, palette, variant } = config;
  const font = fontFamilyAl(variant.fontPairId);
  const parcalar: string[] = [];

  if (display.showTagline && org.slogan.trim()) parcalar.push(org.slogan.trim());
  if (display.showCity && org.sehir.trim()) {
    parcalar.push([org.sehir, org.ilce].filter(Boolean).join(" · "));
  }
  if (display.showYear && org.kurulusYili.trim()) parcalar.push(`Est. ${org.kurulusYili}`);

  if (parcalar.length === 0) return null;

  return (
    <text
      x={256}
      y={y}
      textAnchor="middle"
      fill={palette.muted}
      fontFamily={font}
      fontSize={fontSize}
      fontWeight={600}
      opacity={0.92}
    >
      {parcalar.slice(0, 2).join("  ·  ")}
    </text>
  );
}

export function MonogramBuyuk({
  config,
  cx,
  cy,
  size,
  fill,
}: {
  config: LogoConfigV1;
  cx: number;
  cy: number;
  size: number;
  fill?: string;
}) {
  const { organization: org, palette, variant } = config;
  const font = fontFamilyAl(variant.fontPairId);
  const harf = monogramHarfleri(org.kurumAdi, org.kisaAd);

  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={fill ?? palette.primary}
      fontFamily={font}
      fontSize={size}
      fontWeight={800}
      filter={`url(#${logoUid(config)}-shadow)`}
    >
      {harf}
    </text>
  );
}

export function YayMetin({
  config,
  pathId,
  pathD,
  fontSize = 11,
}: {
  config: LogoConfigV1;
  pathId: string;
  pathD: string;
  fontSize?: number;
}) {
  const { organization: org, palette } = config;
  const metin = (org.kisaAd.trim() || org.kurumAdi.trim() || "KURUM").toUpperCase();
  const font = fontFamilyAl(config.variant.fontPairId);

  return (
    <>
      <path id={pathId} d={pathD} fill="none" />
      <text fill={palette.primary} fontFamily={font} fontSize={fontSize} fontWeight={700} letterSpacing={2}>
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
          {metin.length > 36 ? `${metin.slice(0, 34)}…` : metin}
        </textPath>
      </text>
    </>
  );
}
