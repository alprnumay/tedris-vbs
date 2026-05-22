import type { TemplateProps } from "../primitives";
import { LogoSvgRoot, LogoDefs, KalkanAltiBaslik, AltSloganBand } from "../primitives";
import { SembolGeometrikEgitim } from "../educationSymbols";

export function GeometricEducationLogo({ config, uid }: TemplateProps) {
  const { palette } = config;

  return (
    <LogoSvgRoot config={config}>
      <LogoDefs palette={palette} uid={uid} />
      <rect width={512} height={512} fill={palette.accent} />
      <rect x={0} y={0} width={200} height={512} fill={palette.primary} opacity={0.06} />
      <SembolGeometrikEgitim palette={palette} cx={118} cy={230} size={155} uid={uid} />
      <rect x={188} y={80} width={8} height={352} fill={palette.secondary} />
      <KalkanAltiBaslik config={config} x={210} y={195} anaSize={34} altSize={18} anchor="start" />
      <AltSloganBand config={config} y={300} fontSize={16} />
    </LogoSvgRoot>
  );
}
