import type { TemplateProps } from "../logoShared";
import type { LogoPalette } from "@/types/logoKimlik";
import { emblemById, shieldById } from "@/lib/logo/logoAssets";
import { getPrimaryLine, getSecondaryLine, uppercaseTr } from "@/lib/logo/logoMetinOlculeri";
import { computeModernShieldTextLayout } from "@/lib/logo/logoShieldLayout";

const SERIF_FONT = "'Cinzel', 'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS_FONT = "'Inter', 'Montserrat', 'Segoe UI', 'Helvetica Neue', sans-serif";

function paletteToModernColors(p: LogoPalette) {
  return {
    bgDark: p.primaryDark,
    accentGold: p.secondary,
    textMuted: p.muted,
  };
}

function institutionNameLines(kurumAdi: string): string[] {
  const primary = getPrimaryLine(kurumAdi);
  const secondary = getSecondaryLine(kurumAdi);
  return secondary ? [primary, secondary] : [primary];
}

export function MasterShieldTemplate({ config, uid }: TemplateProps) {
  const org = config.organization;
  const display = config.display ?? { showTagline: true, showYear: true, showCity: true, titleScale: 1 };
  const lego = config.lego;
  const colors = paletteToModernColors(config.palette);

  const activeShield = shieldById(lego?.shieldId);
  const activeEmblem = emblemById(lego?.emblemId);
  const goldGradId = `${uid}-modern-gold`;

  const kisaAd = uppercaseTr(org.kisaAd || "M");
  const nameLines = institutionNameLines(org.kurumAdi);
  const sloganRaw = display.showTagline ? org.slogan?.trim() ?? "" : "";
  const hasSlogan = sloganRaw.length > 0;

  const layout = computeModernShieldTextLayout({
    nameLineCount: nameLines.length,
    firstLineLength: nameLines[0]?.length ?? 0,
    hasExtraSecondary: false,
    hasSlogan,
  });

  const sehir = uppercaseTr(org.sehir || "");
  const ilce = uppercaseTr(org.ilce || "");
  const yil = display.showYear && org.kurulusYili ? String(org.kurulusYili) : "";
  const locationParts = [ilce, sehir].filter(Boolean).join("  |  ");
  const footerText = yil
    ? locationParts
      ? `${locationParts}   •   ${yil}`
      : yil
    : locationParts;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 920" role="img" aria-label={org.kurumAdi || "Premium Kalkan"}>
      <defs>
        <filter id={`${uid}-premium-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy={10} stdDeviation={14} floodColor={colors.bgDark} floodOpacity={0.18} />
        </filter>
        <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE4B5" />
          <stop offset="50%" stopColor={colors.accentGold} />
          <stop offset="100%" stopColor="#96722B" />
        </linearGradient>
      </defs>

      <path d={activeShield.path} fill={colors.bgDark} filter={`url(#${uid}-premium-blur)`} />

      <g transform="translate(360 480) scale(0.94) translate(-360 -480)">
        <path d={activeShield.path} fill="none" stroke={`url(#${goldGradId})`} strokeWidth={3} opacity={0.85} />
      </g>

      {activeEmblem.render(goldGradId, colors.bgDark)}

      <text
        x={360}
        y={130}
        fontFamily={SANS_FONT}
        fontSize={14}
        fontWeight={800}
        fill={colors.accentGold}
        textAnchor="middle"
        letterSpacing={6}
      >
        {kisaAd}
      </text>

      <text
        x={360}
        y={layout.titleY1}
        fontFamily={SERIF_FONT}
        fontSize={layout.mainTitleFontSize}
        fontWeight={700}
        fill={colors.bgDark}
        textAnchor="middle"
        letterSpacing={1}
      >
        {nameLines[0]}
      </text>

      {nameLines.length > 1 ? (
        <text
          x={360}
          y={layout.titleY2}
          fontFamily={SANS_FONT}
          fontSize={22}
          fontWeight={500}
          fill={colors.bgDark}
          textAnchor="middle"
          letterSpacing={6}
        >
          {nameLines[1]}
        </text>
      ) : null}

      <line x1={260} y1={layout.lineY} x2={460} y2={layout.lineY} stroke={colors.accentGold} strokeWidth={1.2} opacity={0.5} />

      {hasSlogan ? (
        <text
          x={360}
          y={layout.sloganY}
          fontFamily={SERIF_FONT}
          fontSize={18}
          fontWeight={400}
          fill={colors.bgDark}
          textAnchor="middle"
          fontStyle="italic"
        >
          {`“ ${sloganRaw} ”`}
        </text>
      ) : null}

      {footerText ? (
        <text
          x={360}
          y={layout.footerY}
          fontFamily={SANS_FONT}
          fontSize={13}
          fontWeight={600}
          fill={colors.textMuted}
          textAnchor="middle"
          letterSpacing={3}
        >
          {footerText}
        </text>
      ) : null}
    </svg>
  );
}

export const PremiumShieldTemplate = MasterShieldTemplate;
