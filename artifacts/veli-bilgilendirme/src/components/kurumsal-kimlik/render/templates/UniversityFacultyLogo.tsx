import type { TemplateProps } from "../primitives";
import { LogoSvgRoot, LogoDefs, Zemin, YayUstKurum, YayAltKonum } from "../primitives";
import { SembolFakulteMesale } from "../educationSymbols";
import { fontFamilyAl } from "@/lib/logo/logoMetinOlculeri";

export function UniversityFacultyLogo({ config, uid }: TemplateProps) {
  const { palette, organization: org, display } = config;
  const font = fontFamilyAl(config.variant.fontPairId);
  const cy = 228;

  return (
    <LogoSvgRoot config={config}>
      <LogoDefs palette={palette} uid={uid} />
      <Zemin palette={palette} uid={uid} />
      <ellipse cx={256} cy={cy} rx={178} ry={168} fill={palette.accent} stroke={palette.primary} strokeWidth={7} />
      <ellipse cx={256} cy={cy} rx={158} ry={148} fill="none" stroke={palette.secondary} strokeWidth={3} />
      <YayUstKurum config={config} uid={uid} cy={cy} r={158} />
      <YayAltKonum config={config} uid={uid} cy={cy} r={158} />
      <SembolFakulteMesale palette={palette} cx={256} cy={cy - 10} uid={uid} />
      {display.showYear && org.kurulusYili.trim() ? (
        <>
          <rect x={196} y={318} width={120} height={32} rx={6} fill={palette.primary} />
          <text x={256} y={340} textAnchor="middle" fill={palette.accent} fontFamily={font} fontSize={18} fontWeight={700}>
            {org.kurulusYili}
          </text>
        </>
      ) : null}
    </LogoSvgRoot>
  );
}
