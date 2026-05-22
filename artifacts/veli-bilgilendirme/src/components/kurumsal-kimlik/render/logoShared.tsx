import type { ReactNode } from "react";
import type { LogoConfigV1, LogoPalette } from "@/types/logoKimlik";
import {
  fitTextSize,
  fontFamilyAl,
  getPrimaryLine,
  getSecondaryLine,
  sehirYilMetni,
  uppercaseTr,
  yayFontBoyutu,
} from "@/lib/logo/logoMetinOlculeri";

export interface TemplateProps {
  config: LogoConfigV1;
  uid: string;
}

export function logoUid(config: LogoConfigV1): string {
  return config.fingerprint.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || "logo";
}

export function LogoPremiumDefs({ palette, uid }: { palette: LogoPalette; uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-shield`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={palette.primaryDark} />
        <stop offset="100%" stopColor={palette.primary} />
      </linearGradient>
      <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={palette.secondarySoft} />
        <stop offset="40%" stopColor={palette.secondary} />
        <stop offset="100%" stopColor={palette.secondary} stopOpacity={0.85} />
      </linearGradient>
      <radialGradient id={`${uid}-cream`} cx="50%" cy="42%" r="58%">
        <stop offset="0%" stopColor={palette.white} />
        <stop offset="75%" stopColor={palette.accent} />
        <stop offset="100%" stopColor={palette.accent} />
      </radialGradient>
      <filter id={`${uid}-sh`} x="-22%" y="-22%" width="144%" height="144%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor={palette.primaryDark} floodOpacity="0.2" />
      </filter>
      <filter id={`${uid}-txt`} x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor={palette.primaryDark} floodOpacity="0.14" />
      </filter>
    </defs>
  );
}

const ISIK_ACILARI: [number, number][] = [
  [-44, -108],
  [-22, -116],
  [0, -120],
  [22, -116],
  [44, -108],
];

/** Ana eğitim amblemi: kitap + meşale + 5 ışık — logo kalitesi */
export function EducationTorchBookMark({
  cx,
  cy,
  scale = 1,
  palette,
  uid,
}: {
  cx: number;
  cy: number;
  scale?: number;
  palette: LogoPalette;
  uid: string;
}) {
  const n = palette.primaryDark;
  const g = palette.secondary;
  const gs = palette.secondarySoft;
  const c = palette.accent;
  const w = palette.white;

  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`} filter={`url(#${uid}-sh)`}>
      {ISIK_ACILARI.map(([x2, y2], i) => (
        <line
          key={i}
          x1={0}
          y1={-82}
          x2={x2}
          y2={y2}
          stroke={g}
          strokeWidth={4.5}
          strokeLinecap="round"
          opacity={0.5}
        />
      ))}
      <ellipse cx={0} cy={-38} rx={50} ry={15} fill={g} opacity={0.18} />
      <rect x={-11} y={-92} width={22} height={72} rx={5} fill={`url(#${uid}-gold)`} stroke={n} strokeWidth={2.5} />
      <path
        d="M0 -112 C24 -82 22 -54 0 -42 C-22 -54 -24 -82 0 -112 Z"
        fill={g}
        stroke={n}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <path
        d="M0 -100 C16 -76 15 -58 0 -48 C-15 -58 -16 -76 0 -100 Z"
        fill={gs}
        stroke={n}
        strokeWidth={1}
      />
      <path
        d="M-78 42 L0 14 L78 42 L78 62 Q0 82 -78 62 Z"
        fill={c}
        stroke={n}
        strokeWidth={4.5}
        strokeLinejoin="round"
      />
      <path
        d="M-68 46 L0 22 L68 46 L68 56 Q0 72 -68 56 Z"
        fill={w}
        stroke={n}
        strokeWidth={2}
      />
      <path d="M-60 48 L0 26 L60 48" fill="none" stroke={n} strokeWidth={1.5} opacity={0.22} />
      <rect x={-6} y={14} width={12} height={54} fill={g} opacity={0.28} rx={2} />
      <line x1={0} y1={14} x2={0} y2={62} stroke={g} strokeWidth={3.5} />
      <line x1={-52} y1={72} x2={52} y2={72} stroke={n} strokeWidth={3} opacity={0.35} />
      <line x1={-38} y1={78} x2={38} y2={78} stroke={g} strokeWidth={2.5} opacity={0.45} />
    </g>
  );
}

/** Kalkan içi: kitap + meşale + kurumsal yıldız birleşimi */
export function PremiumShieldMark({
  cx,
  cy,
  scale = 1,
  palette,
  uid,
}: {
  cx: number;
  cy: number;
  scale?: number;
  palette: LogoPalette;
  uid: string;
}) {
  const n = palette.primaryDark;
  const g = palette.secondary;

  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
      <EducationTorchBookMark cx={0} cy={18} scale={0.92} palette={palette} uid={uid} />
      <polygon
        points="0,-58 12,-32 40,-32 17,-14 26,16 0,2 -26,16 -17,-14 -40,-32 -12,-32"
        fill={g}
        stroke={n}
        strokeWidth={2}
        strokeLinejoin="round"
        transform="translate(0,-8)"
      />
      <circle cx={0} cy={-18} r={7} fill={palette.white} stroke={n} strokeWidth={1} />
    </g>
  );
}

/** Yatay logo / küçük mühür amblemi */
export function SmallSealMark({
  cx,
  cy,
  size,
  palette,
  uid,
}: {
  cx: number;
  cy: number;
  size: number;
  palette: LogoPalette;
  uid: string;
}) {
  const r = size / 2;
  return (
    <g filter={`url(#${uid}-sh)`}>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}-cream)`} stroke={palette.primaryDark} strokeWidth={9} />
      <circle cx={cx} cy={cy} r={r - 14} fill="none" stroke={palette.secondary} strokeWidth={5} />
      <circle cx={cx} cy={cy} r={r - 22} fill="none" stroke={palette.primary} strokeWidth={2} opacity={0.5} />
      <EducationTorchBookMark cx={cx} cy={cy - 2} scale={size / 200} palette={palette} uid={uid} />
    </g>
  );
}

/** @deprecated — EducationTorchBookMark kullanın */
export const SembolKitapMesale = EducationTorchBookMark;

/** @deprecated — PremiumShieldMark kullanın */
export const SembolKitapYildiz = PremiumShieldMark;

export function KalkanPremium({ palette, uid }: { palette: LogoPalette; uid: string }) {
  return (
    <g filter={`url(#${uid}-sh)`}>
      <path
        d="M256 48 C320 70 365 86 402 105 L384 270 C370 342 318 386 256 414 C194 386 142 342 128 270 L110 105 C147 86 192 70 256 48 Z"
        fill={`url(#${uid}-shield)`}
        stroke={palette.secondary}
        strokeWidth={9}
        strokeLinejoin="round"
      />
      <path
        d="M256 48 C320 70 365 86 402 105 L384 270 C370 342 318 386 256 414 C194 386 142 342 128 270 L110 105 C147 86 192 70 256 48 Z"
        fill="none"
        stroke={palette.primaryDark}
        strokeWidth={3}
        strokeLinejoin="round"
        opacity={0.35}
      />
      <path
        d="M256 76 C306 94 342 108 372 122 L358 252 C346 308 306 348 256 372 C206 348 166 308 154 252 L140 122 C170 108 206 94 256 76 Z"
        fill={palette.white}
        stroke={palette.primary}
        strokeWidth={4}
      />
    </g>
  );
}

/** Üst kavis hissi — düz letter-spaced metin */
export function UstDuzKavisMetin({ config, y = 88 }: { config: LogoConfigV1; y?: number }) {
  const kurum = uppercaseTr(config.organization.kurumAdi || "KURUM ADI");
  const fs = yayFontBoyutu(kurum.length, 20, 15);
  const spacing = kurum.length > 28 ? 2 : 3.5;
  const p = config.palette;

  return (
    <text
      x={256}
      y={y}
      textAnchor="middle"
      fill={p.primaryDark}
      fontFamily={fontFamilyAl("klasik_serif")}
      fontSize={fs}
      fontWeight={700}
      letterSpacing={spacing}
    >
      {kurum.length > 46 ? `${kurum.slice(0, 44)}…` : kurum}
    </text>
  );
}

export function KurumAdiBlok({
  config,
  x,
  y,
  anaSize,
  altSize,
  align = "middle",
  anaFill,
  altFill,
  secondaryY,
  minLineGap = 22,
}: {
  config: LogoConfigV1;
  x: number;
  y: number;
  anaSize: number;
  altSize: number;
  align?: "start" | "middle" | "end";
  anaFill?: string;
  altFill?: string;
  /** İkinci satırın sabit y konumu — çakışmayı önler */
  secondaryY?: number;
  minLineGap?: number;
}) {
  const org = config.organization;
  const primary = getPrimaryLine(org.kurumAdi);
  const secondary = getSecondaryLine(org.kurumAdi);
  const anaFs = fitTextSize(primary, anaSize, Math.max(anaSize * 0.72, 14), 18);
  const altFs = secondary ? fitTextSize(secondary, altSize, Math.max(altSize * 0.78, 12), 24) : 0;
  const fontSans = fontFamilyAl("guclu_kurumsal");
  const fontSerif = fontFamilyAl("klasik_serif");
  const p = config.palette;
  const altY = secondaryY ?? y + Math.max(anaFs + minLineGap * 0.45, minLineGap);

  return (
    <g filter={`url(#${logoUid(config)}-txt)`}>
      <text
        x={x}
        y={y}
        textAnchor={align}
        fill={anaFill ?? p.primaryDark}
        fontFamily={fontSans}
        fontSize={anaFs}
        fontWeight={800}
        letterSpacing={primary.length > 14 ? 1.2 : 1.8}
      >
        {primary}
      </text>
      {secondary ? (
        <text
          x={x}
          y={altY}
          textAnchor={align}
          fill={altFill ?? p.primary}
          fontFamily={fontSerif}
          fontSize={altFs}
          fontWeight={700}
          letterSpacing={2}
        >
          {secondary}
        </text>
      ) : null}
    </g>
  );
}

export function SloganBlok({
  config,
  x,
  y,
  fontSize = 15,
  align = "middle",
  bold = false,
}: {
  config: LogoConfigV1;
  x: number;
  y: number;
  fontSize?: number;
  align?: "start" | "middle" | "end";
  bold?: boolean;
}) {
  const slogan = config.organization?.slogan?.trim() ?? "";
  if (!config.display?.showTagline || !slogan) return null;
  const fs = fitTextSize(slogan, fontSize, fontSize - 3, 36);
  return (
    <text
      x={x}
      y={y}
      textAnchor={align}
      fill={config.palette.muted}
      fontFamily={fontFamilyAl("sade_minimal")}
      fontSize={fs}
      fontWeight={bold ? 700 : 600}
    >
      {slogan}
    </text>
  );
}

export function KonumBlok({
  config,
  x,
  y,
  fontSize = 13,
  align = "middle",
}: {
  config: LogoConfigV1;
  x: number;
  y: number;
  fontSize?: number;
  align?: "start" | "middle" | "end";
}) {
  const org = config.organization ?? {
    kurumAdi: "",
    kisaAd: "",
    slogan: "",
    sehir: "",
    ilce: "",
    kurulusYili: "",
  };
  const display = config.display ?? { showTagline: true, showYear: true, showCity: true, titleScale: 1 };
  const metin = uppercaseTr(sehirYilMetni(org.sehir, org.ilce, display.showYear ? org.kurulusYili : ""));
  if (!metin) return null;
  const fs = fitTextSize(metin, fontSize, fontSize - 2, 40);
  return (
    <text
      x={x}
      y={y}
      textAnchor={align}
      fill={config.palette.muted}
      fontFamily={fontFamilyAl("sade_minimal")}
      fontSize={fs}
      fontWeight={600}
      letterSpacing={0.5}
    >
      {metin}
    </text>
  );
}

export function SvgKok({ children, viewBox, label }: { children: ReactNode; viewBox: string; label: string }) {
  return (
    <svg viewBox={viewBox} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={label}>
      {children}
    </svg>
  );
}
