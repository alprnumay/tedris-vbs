import type { TemplateProps } from "../primitives";
import { LogoSvgRoot, LogoDefs, AltSloganBand } from "../primitives";
import { SembolMetalUst } from "../educationSymbols";
import { kurumBaslikHiyerarsi, fontFamilyAl } from "@/lib/logo/logoMetinOlculeri";

export function MetallicWordmarkLogo({ config, uid }: TemplateProps) {
  const { palette } = config;
  const font = fontFamilyAl(config.variant.fontPairId);
  const { ana, alt } = kurumBaslikHiyerarsi(config.organization.kurumAdi);

  return (
    <LogoSvgRoot config={config}>
      <LogoDefs palette={palette} uid={uid} />
      <rect width={512} height={512} fill="#1a1a22" />
      <rect width={512} height={512} fill={palette.primary} opacity={0.92} />
      <SembolMetalUst palette={palette} cx={256} cy={155} uid={uid} />
      <text
        x={256}
        y={alt ? 268 : 285}
        textAnchor="middle"
        fill={`url(#${uid}-metal)`}
        stroke={palette.primary}
        strokeWidth={0.6}
        fontFamily={font}
        fontSize={44}
        fontWeight={800}
        filter={`url(#${uid}-sh)`}
      >
        {ana.toLocaleUpperCase("tr-TR")}
      </text>
      {alt ? (
        <text x={256} y={312} textAnchor="middle" fill={palette.secondary} fontFamily={font} fontSize={22} fontWeight={600}>
          {alt.toLocaleUpperCase("tr-TR")}
        </text>
      ) : null}
      <line x1={96} y1={340} x2={416} y2={340} stroke={palette.secondary} strokeWidth={2} opacity={0.7} />
      <AltSloganBand config={config} y={385} fontSize={16} />
    </LogoSvgRoot>
  );
}
