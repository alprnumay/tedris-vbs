import type { ReactNode } from "react";
import type { LogoConfigV1, LogoPalette } from "@/types/logoKimlik";
import {
  kurumBaslikHiyerarsi,
  fontFamilyAl,
  yayFontBoyutu,
  sehirYilMetni,
  monogramHarfleri,
} from "@/lib/logo/logoMetinOlculeri";

export interface TemplateProps {
  config: LogoConfigV1;
  uid: string;
}

export function logoUid(config: LogoConfigV1): string {
  return config.fingerprint.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || "logo";
}

export function LogoSvgRoot({ config, children }: { config: LogoConfigV1; children: ReactNode }) {
  return (
    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={config.organization.kurumAdi || "Logo"}>
      {children}
    </svg>
  );
}

export function LogoDefs({ palette, uid }: { palette: LogoPalette; uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={palette.accent} />
        <stop offset="100%" stopColor={palette.secondary} stopOpacity={0.18} />
      </linearGradient>
      <linearGradient id={`${uid}-shield`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={palette.primary} />
        <stop offset="55%" stopColor={palette.primary} stopOpacity={0.88} />
        <stop offset="100%" stopColor={palette.primary} stopOpacity={0.65} />
      </linearGradient>
      <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={palette.secondary} />
        <stop offset="50%" stopColor="#f5e6b8" />
        <stop offset="100%" stopColor={palette.secondary} stopOpacity={0.85} />
      </linearGradient>
      <linearGradient id={`${uid}-metal`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e8e8e8" />
        <stop offset="35%" stopColor="#ffffff" />
        <stop offset="55%" stopColor={palette.secondary} />
        <stop offset="100%" stopColor={palette.primary} />
      </linearGradient>
      <radialGradient id={`${uid}-seal`} cx="50%" cy="45%" r="50%">
        <stop offset="0%" stopColor={palette.accent} />
        <stop offset="85%" stopColor={palette.accent} />
        <stop offset="100%" stopColor={palette.secondary} stopOpacity={0.15} />
      </radialGradient>
      <filter id={`${uid}-sh`} x="-12%" y="-12%" width="124%" height="124%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={palette.primary} floodOpacity="0.22" />
      </filter>
      <filter id={`${uid}-soft`} x="-8%" y="-8%" width="116%" height="116%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.14" />
      </filter>
    </defs>
  );
}

export function Zemin({ palette, uid, koyu = false }: { palette: LogoPalette; uid: string; koyu?: boolean }) {
  if (koyu) {
    return (
      <>
        <rect width={512} height={512} fill={palette.primary} />
        <rect width={512} height={512} fill={`url(#${uid}-bg)`} opacity={0.25} />
      </>
    );
  }
  return (
    <>
      <rect width={512} height={512} fill={`url(#${uid}-bg)`} />
      <rect x={24} y={24} width={464} height={464} rx={20} fill={palette.accent} opacity={0.6} />
    </>
  );
}

/** Üst yay — tam kurum adı */
export function YayUstKurum({ config, uid, cy = 248, r = 188 }: { config: LogoConfigV1; uid: string; cy?: number; r?: number }) {
  const metin = config.organization.kurumAdi.trim().toLocaleUpperCase("tr-TR") || "KURUM ADI";
  const font = fontFamilyAl(config.variant.fontPairId);
  const fs = yayFontBoyutu(metin.length, 12, 8);
  const pathId = `${uid}-arcTop`;
  const d = `M ${256 - r},${cy} A ${r},${r} 0 0,1 ${256 + r},${cy}`;

  return (
    <>
      <path id={pathId} d={d} fill="none" />
      <text fill={config.palette.primary} fontFamily={font} fontSize={fs} fontWeight={700} letterSpacing={1.5}>
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
          {metin.length > 52 ? `${metin.slice(0, 50)}…` : metin}
        </textPath>
      </text>
    </>
  );
}

/** Alt yay — şehir / ilçe / yıl */
export function YayAltKonum({ config, uid, cy = 248, r = 188 }: { config: LogoConfigV1; uid: string; cy?: number; r?: number }) {
  const { display, organization: org } = config;
  if (!display.showCity && !display.showYear) return null;
  const metin = sehirYilMetni(org.sehir, org.ilce, display.showYear ? org.kurulusYili : "").toLocaleUpperCase("tr-TR");
  if (!metin) return null;
  const font = fontFamilyAl(config.variant.fontPairId);
  const fs = yayFontBoyutu(metin.length, 10, 7);
  const pathId = `${uid}-arcBot`;
  const d = `M ${256 + r},${cy} A ${r},${r} 0 0,1 ${256 - r},${cy}`;

  return (
    <>
      <path id={pathId} d={d} fill="none" />
      <text fill={config.palette.primary} fontFamily={font} fontSize={fs} fontWeight={600} letterSpacing={1}>
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
          {metin}
        </textPath>
      </text>
    </>
  );
}

/** Mühür içi okunaklı slogan */
export function IcSlogan({ config, y, fontSize = 14 }: { config: LogoConfigV1; y: number; fontSize?: number }) {
  const slogan = config.organization.slogan.trim();
  if (!config.display.showTagline || !slogan) return null;
  const font = fontFamilyAl(config.variant.fontPairId);
  return (
    <text x={256} y={y} textAnchor="middle" fill={config.palette.muted} fontFamily={font} fontSize={fontSize} fontWeight={600}>
      {slogan}
    </text>
  );
}

/** Kalkan altı — tam kurum adı güçlü */
export function KalkanAltiBaslik({
  config,
  x = 256,
  y,
  anaSize = 32,
  altSize = 17,
  anchor = "middle",
}: {
  config: LogoConfigV1;
  x?: number;
  y: number;
  anaSize?: number;
  altSize?: number;
  anchor?: "start" | "middle" | "end";
}) {
  const { ana, alt } = kurumBaslikHiyerarsi(config.organization.kurumAdi);
  const font = fontFamilyAl(config.variant.fontPairId);
  const { palette } = config;

  return (
    <>
      <text x={x} y={y} textAnchor={anchor} fill={palette.text} fontFamily={font} fontSize={anaSize} fontWeight={800} filter={`url(#${logoUid(config)}-sh)`}>
        {ana.toLocaleUpperCase("tr-TR")}
      </text>
      {alt ? (
        <text x={x} y={y + anaSize * 0.85} textAnchor={anchor} fill={palette.primary} fontFamily={font} fontSize={altSize} fontWeight={600} letterSpacing={0.8}>
          {alt.toLocaleUpperCase("tr-TR")}
        </text>
      ) : null}
    </>
  );
}

export function AltSloganBand({
  config,
  y,
  fontSize = 15,
}: {
  config: LogoConfigV1;
  y: number;
  fontSize?: number;
}) {
  const { organization: org, display, palette } = config;
  const font = fontFamilyAl(config.variant.fontPairId);
  const parcalar: string[] = [];
  if (display.showTagline && org.slogan.trim()) parcalar.push(org.slogan.trim());
  if (display.showCity && org.sehir.trim()) {
    parcalar.push([org.sehir, org.ilce].filter(Boolean).join(" · "));
  }
  if (display.showYear && org.kurulusYili.trim()) parcalar.push(`Est. ${org.kurulusYili}`);
  if (parcalar.length === 0) return null;

  return (
    <>
      <rect x={80} y={y - fontSize - 4} width={352} height={fontSize + 14} rx={6} fill={palette.primary} opacity={0.06} />
      <text x={256} y={y} textAnchor="middle" fill={palette.muted} fontFamily={font} fontSize={fontSize} fontWeight={600}>
        {parcalar.slice(0, 2).join("   ·   ")}
      </text>
    </>
  );
}

export function PremiumKalkanPath({ palette, uid, cx = 256, top = 72 }: { palette: LogoPalette; uid: string; cx?: number; top?: number }) {
  return (
    <g filter={`url(#${uid}-sh)`} transform={`translate(${cx - 120}, ${top})`}>
      <path
        d="M120 8 L228 52 L218 198 Q120 268 22 198 L12 52 Z"
        fill={`url(#${uid}-shield)`}
        stroke={palette.secondary}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <path d="M120 28 L208 64 L200 188 Q120 248 40 188 L32 64 Z" fill={palette.accent} stroke={palette.primary} strokeWidth={2} opacity={0.95} />
    </g>
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
  const harf = monogramHarfleri(config.organization.kurumAdi, config.organization.kisaAd, 3);
  const font = fontFamilyAl(config.variant.fontPairId);
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill={fill ?? config.palette.primary} fontFamily={font} fontSize={size} fontWeight={800} filter={`url(#${logoUid(config)}-sh)`}>
      {harf}
    </text>
  );
}
