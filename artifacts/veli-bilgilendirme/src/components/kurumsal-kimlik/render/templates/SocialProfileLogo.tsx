import type { TemplateProps } from "../primitives";
import { LogoSvgRoot, LogoDefs, MonogramBuyuk } from "../primitives";

export function SocialProfileLogo({ config, uid }: TemplateProps) {
  const { palette } = config;

  return (
    <LogoSvgRoot config={config}>
      <LogoDefs palette={palette} uid={uid} />
      <rect width={512} height={512} fill={palette.primary} />
      <circle cx={256} cy={256} r={228} fill={palette.accent} stroke={palette.secondary} strokeWidth={10} filter={`url(#${uid}-sh)`} />
      <circle cx={256} cy={256} r={198} fill="none" stroke={palette.primary} strokeWidth={4} opacity={0.35} />
      <MonogramBuyuk config={config} cx={256} cy={268} size={128} fill={palette.primary} />
    </LogoSvgRoot>
  );
}
