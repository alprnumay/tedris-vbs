import type { ReactNode } from "react";
import type { LogoConfigV1, LogoPalette } from "@/types/logoKimlik";
import { kurumBaslikHiyerarsi, fontFamilyAl, sehirYilMetni } from "@/lib/logo/logoMetinOlculeri";

export interface TemplateProps {
  config: LogoConfigV1;
  uid: string;
}

export function logoUid(config: LogoConfigV1): string {
  return config.fingerprint.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || "logo";
}

export function LogoDefsPremium({ palette, uid }: { palette: LogoPalette; uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-shield`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={palette.primary} />
        <stop offset="100%" stopColor={palette.primary} stopOpacity={0.82} />
      </linearGradient>
      <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={palette.secondary} />
        <stop offset="50%" stopColor="#f0d998" />
        <stop offset="100%" stopColor={palette.secondary} stopOpacity={0.9} />
      </linearGradient>
      <radialGradient id={`${uid}-inner`} cx="50%" cy="42%" r="55%">
        <stop offset="0%" stopColor={palette.accent} />
        <stop offset="88%" stopColor={palette.accent} />
        <stop offset="100%" stopColor={palette.secondary} stopOpacity={0.22} />
      </radialGradient>
      <filter id={`${uid}-sh`} x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor={palette.primary} floodOpacity="0.2" />
      </filter>
      <filter id={`${uid}-mono`} x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.35" />
      </filter>
    </defs>
  );
}

/** Dolu kitap + meşale — clipart değil, kompozisyon parçası */
export function KitapMesaleSembol({
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
  const { primary, secondary, accent } = palette;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`} filter={`url(#${uid}-sh)`}>
      <path
        d="M-52 22 L0 2 L52 22 L52 38 Q0 50 -52 38 Z"
        fill={accent}
        stroke={primary}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d="M0 2 L0 38" stroke={secondary} strokeWidth={2.5} opacity={0.85} />
      <path
        d="M-38 24 Q-18 30 0 26 Q18 30 38 24"
        fill="none"
        stroke={primary}
        strokeWidth={2}
        opacity={0.35}
      />
      <rect x={-6} y={-58} width={12} height={48} rx={3} fill={`url(#${uid}-gold)`} stroke={primary} strokeWidth={1.5} />
      <path
        d="M0 -78 C16 -58 14 -42 0 -34 C-14 -42 -16 -58 0 -78 Z"
        fill={secondary}
        stroke={primary}
        strokeWidth={1.5}
      />
      <path d="M0 -68 C6 -54 5 -44 0 -40 C-5 -44 -6 -54 0 -68 Z" fill="#fff8e8" opacity={0.55} />
      <ellipse cx={0} cy={-32} rx={28} ry={8} fill={secondary} opacity={0.18} />
    </g>
  );
}

/** Kalkan — beşgen değil, kurumsal form */
export function PremiumKalkanSekil({
  x,
  y,
  w,
  h,
  palette,
  uid,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  palette: LogoPalette;
  uid: string;
}) {
  const cx = x + w / 2;
  return (
    <g filter={`url(#${uid}-sh)`}>
      <path
        d={`M${cx} ${y + 8} L${x + w - 6} ${y + h * 0.22} L${x + w - 10} ${y + h * 0.72} Q${cx} ${y + h + 6} ${x + 10} ${y + h * 0.72} L${x + 6} ${y + h * 0.22} Z`}
        fill={`url(#${uid}-shield)`}
        stroke={palette.secondary}
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <path
        d={`M${cx} ${y + 28} L${x + w - 28} ${y + h * 0.26} L${x + w - 32} ${y + h * 0.66} Q${cx} ${y + h - 18} ${x + 32} ${y + h * 0.66} L${x + 28} ${y + h * 0.26} Z`}
        fill={palette.accent}
        stroke={palette.primary}
        strokeWidth={2.5}
        opacity={0.97}
      />
    </g>
  );
}

export function KitapYildizSembol({
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
  const { primary, secondary, accent } = palette;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
      <path
        d="M-46 20 L0 0 L46 20 L46 34 Q0 44 -46 34 Z"
        fill={accent}
        stroke={primary}
        strokeWidth={2.5}
      />
      <path d="M0 0 L0 32" stroke={secondary} strokeWidth={2} />
      <polygon
        points="0,-42 10,-18 36,-18 14,-2 22,24 0,10 -22,24 -14,-2 -36,-18 -10,-18"
        fill={secondary}
        stroke={primary}
        strokeWidth={1.2}
      />
    </g>
  );
}

export function AmblemDaire({
  cx,
  cy,
  r,
  palette,
  uid,
  children,
}: {
  cx: number;
  cy: number;
  r: number;
  palette: LogoPalette;
  uid: string;
  children: ReactNode;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}-inner)`} stroke={palette.primary} strokeWidth={5} />
      <circle cx={cx} cy={cy} r={r - 10} fill="none" stroke={palette.secondary} strokeWidth={2.5} />
      {children}
    </g>
  );
}

export function KurumAdiIkiSatir({
  config,
  x,
  y,
  anaSize,
  altSize,
  fill,
  align = "middle",
}: {
  config: LogoConfigV1;
  x: number;
  y: number;
  anaSize: number;
  altSize: number;
  fill?: string;
  align?: "start" | "middle" | "end";
}) {
  const { ana, alt } = kurumBaslikHiyerarsi(config.organization.kurumAdi);
  const font = fontFamilyAl(config.variant.fontPairId);
  const anchor = align;
  const color = fill ?? config.palette.text;

  return (
    <>
      <text
        x={x}
        y={y}
        textAnchor={anchor}
        fill={color}
        fontFamily={font}
        fontSize={anaSize}
        fontWeight={800}
        letterSpacing={1.2}
      >
        {ana.toLocaleUpperCase("tr-TR")}
      </text>
      {alt ? (
        <text
          x={x}
          y={y + anaSize * 0.92}
          textAnchor={anchor}
          fill={config.palette.primary}
          fontFamily={font}
          fontSize={altSize}
          fontWeight={700}
          letterSpacing={0.6}
        >
          {alt.toLocaleUpperCase("tr-TR")}
        </text>
      ) : null}
    </>
  );
}

export function KonumYilSatiri({
  config,
  x,
  y,
  fontSize = 13,
}: {
  config: LogoConfigV1;
  x: number;
  y: number;
  fontSize?: number;
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
  const metin = sehirYilMetni(org.sehir, org.ilce, display.showYear ? org.kurulusYili : "").toLocaleUpperCase("tr-TR");
  if (!metin) return null;
  const font = fontFamilyAl("sade_minimal");
  return (
    <text x={x} y={y} textAnchor="middle" fill={config.palette.muted} fontFamily={font} fontSize={fontSize} fontWeight={600} letterSpacing={0.8}>
      {metin}
    </text>
  );
}

export function SloganSatiri({
  config,
  x,
  y,
  fontSize = 15,
}: {
  config: LogoConfigV1;
  x: number;
  y: number;
  fontSize?: number;
}) {
  const org = config.organization;
  const slogan = org?.slogan?.trim() ?? "";
  if (!config.display?.showTagline || !slogan) return null;
  const font = fontFamilyAl("sade_minimal");
  return (
    <text x={x} y={y} textAnchor="middle" fill={config.palette.muted} fontFamily={font} fontSize={fontSize} fontWeight={600}>
      {slogan}
    </text>
  );
}
