import type { TemplateProps } from "../primitives";
import { LogoSvgRoot, LogoDefs, KalkanAltiBaslik, AltSloganBand } from "../primitives";
import { SembolAkademiPanel } from "../educationSymbols";

export function AcademyWordmarkLogo({ config, uid }: TemplateProps) {
  const { palette } = config;

  return (
    <LogoSvgRoot config={config}>
      <LogoDefs palette={palette} uid={uid} />
      <rect width={512} height={512} fill={palette.accent} />
      <rect x={40} y={56} width={432} height={400} rx={22} fill={palette.accent} stroke={palette.primary} strokeWidth={3} filter={`url(#${uid}-sh)`} />
      <rect x={40} y={56} width={432} height={10} fill={palette.primary} opacity={0.85} />
      <SembolAkademiPanel palette={palette} cx={128} cy={248} uid={uid} />
      <line x1={200} y1={100} x2={200} y2={412} stroke={palette.secondary} strokeWidth={2} opacity={0.45} />
      <KalkanAltiBaslik config={config} x={310} y={210} anaSize={36} altSize={19} />
      <AltSloganBand config={config} y={310} fontSize={16} />
    </LogoSvgRoot>
  );
}
