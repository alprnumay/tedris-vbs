import type { TemplateProps } from "../primitives";
import { LogoSvgRoot, LogoDefs, Zemin, MonogramBuyuk } from "../primitives";
import { kurumBaslikHiyerarsi, fontFamilyAl } from "@/lib/logo/logoMetinOlculeri";

export function MonogramSealLogo({ config, uid }: TemplateProps) {
  const { palette } = config;
  const font = fontFamilyAl(config.variant.fontPairId);
  const { ana, alt } = kurumBaslikHiyerarsi(config.organization.kurumAdi);

  return (
    <LogoSvgRoot config={config}>
      <LogoDefs palette={palette} uid={uid} />
      <Zemin palette={palette} uid={uid} />
      <rect x={72} y={72} width={368} height={368} rx={28} fill={palette.accent} stroke={palette.primary} strokeWidth={6} filter={`url(#${uid}-sh)`} />
      <circle cx={256} cy={240} r={128} fill={palette.primary} opacity={0.07} stroke={palette.primary} strokeWidth={5} />
      <circle cx={256} cy={240} r={112} fill="none" stroke={palette.secondary} strokeWidth={3} />
      <MonogramBuyuk config={config} cx={256} cy={248} size={100} fill={palette.primary} />
      <text x={256} y={400} textAnchor="middle" fill={palette.text} fontFamily={font} fontSize={20} fontWeight={700}>
        {ana.toLocaleUpperCase("tr-TR")}
      </text>
      {alt ? (
        <text x={256} y={428} textAnchor="middle" fill={palette.muted} fontFamily={font} fontSize={14} fontWeight={600}>
          {alt.toLocaleUpperCase("tr-TR")}
        </text>
      ) : null}
    </LogoSvgRoot>
  );
}
