import type { TemplateProps } from "../primitives";
import { LogoSvgRoot, LogoDefs, Zemin, YayUstKurum, YayAltKonum, IcSlogan } from "../primitives";
import { SembolKitapMesale } from "../educationSymbols";

export function OfficialSealLogo({ config, uid }: TemplateProps) {
  const { palette } = config;
  const cy = 248;

  return (
    <LogoSvgRoot config={config}>
      <LogoDefs palette={palette} uid={uid} />
      <Zemin palette={palette} uid={uid} />
      <circle cx={256} cy={cy} r={198} fill={`url(#${uid}-seal)`} stroke={palette.primary} strokeWidth={9} />
      <circle cx={256} cy={cy} r={178} fill="none" stroke={palette.secondary} strokeWidth={4} />
      <YayUstKurum config={config} uid={uid} cy={cy} r={178} />
      <YayAltKonum config={config} uid={uid} cy={cy} r={178} />
      <circle cx={256} cy={cy} r={108} fill={palette.accent} stroke={palette.primary} strokeWidth={3} />
      <SembolKitapMesale palette={palette} cx={256} cy={cy - 8} size={128} uid={uid} />
      <IcSlogan config={config} y={cy + 72} fontSize={15} />
    </LogoSvgRoot>
  );
}
