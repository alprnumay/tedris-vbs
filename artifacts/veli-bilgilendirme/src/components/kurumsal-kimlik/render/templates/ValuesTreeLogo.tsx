import type { TemplateProps } from "../primitives";
import { LogoSvgRoot, LogoDefs, Zemin, KalkanAltiBaslik, AltSloganBand } from "../primitives";
import { SembolCinarKitap } from "../educationSymbols";

export function ValuesTreeLogo({ config, uid }: TemplateProps) {
  const { palette } = config;

  return (
    <LogoSvgRoot config={config}>
      <LogoDefs palette={palette} uid={uid} />
      <Zemin palette={palette} uid={uid} />
      <rect x={56} y={48} width={400} height={416} rx={24} fill={palette.accent} stroke={palette.primary} strokeWidth={3} opacity={0.95} />
      <SembolCinarKitap palette={palette} cx={256} cy={175} uid={uid} />
      <KalkanAltiBaslik config={config} x={256} y={340} anaSize={32} altSize={17} />
      <AltSloganBand config={config} y={420} fontSize={15} />
    </LogoSvgRoot>
  );
}
