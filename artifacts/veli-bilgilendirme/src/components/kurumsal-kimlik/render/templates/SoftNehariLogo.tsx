import type { TemplateProps } from "../primitives";
import { LogoSvgRoot, LogoDefs, KalkanAltiBaslik, AltSloganBand } from "../primitives";
import { SembolNehari } from "../educationSymbols";

export function SoftNehariLogo({ config, uid }: TemplateProps) {
  const { palette } = config;

  return (
    <LogoSvgRoot config={config}>
      <LogoDefs palette={palette} uid={uid} />
      <rect width={512} height={512} fill="#f4faf6" />
      <rect x={64} y={72} width={384} height={368} rx={48} fill={palette.accent} stroke={palette.primary} strokeWidth={4} filter={`url(#${uid}-sh)`} />
      <rect x={80} y={88} width={352} height={336} rx={40} fill="none" stroke={palette.secondary} strokeWidth={2} opacity={0.4} />
      <SembolNehari palette={palette} cx={256} cy={200} uid={uid} />
      <KalkanAltiBaslik config={config} x={256} y={348} anaSize={30} altSize={16} />
      <AltSloganBand config={config} y={418} fontSize={15} />
    </LogoSvgRoot>
  );
}
