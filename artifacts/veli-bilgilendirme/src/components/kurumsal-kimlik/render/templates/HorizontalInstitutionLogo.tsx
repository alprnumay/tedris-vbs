import type { TemplateProps } from "../primitives";
import { LogoSvgRoot, LogoDefs, KalkanAltiBaslik, AltSloganBand } from "../primitives";
import { SembolYatayAmblem } from "../educationSymbols";

export function HorizontalInstitutionLogo({ config, uid }: TemplateProps) {
  const { palette } = config;

  return (
    <LogoSvgRoot config={config}>
      <LogoDefs palette={palette} uid={uid} />
      <rect width={512} height={512} fill={palette.accent} />
      <rect x={28} y={148} width={456} height={216} rx={18} fill={palette.accent} stroke={palette.primary} strokeWidth={3} filter={`url(#${uid}-soft)`} />
      <circle cx={118} cy={256} r={78} fill={palette.primary} opacity={0.08} stroke={palette.primary} strokeWidth={4} />
      <SembolYatayAmblem palette={palette} cx={118} cy={256} uid={uid} />
      <KalkanAltiBaslik config={config} x={268} y={228} anaSize={32} altSize={17} />
      <AltSloganBand config={config} y={310} fontSize={15} />
    </LogoSvgRoot>
  );
}
