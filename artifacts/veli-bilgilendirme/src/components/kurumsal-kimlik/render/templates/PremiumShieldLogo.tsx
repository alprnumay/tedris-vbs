import type { TemplateProps } from "../primitives";
import { LogoSvgRoot, LogoDefs, Zemin, PremiumKalkanPath, KalkanAltiBaslik, AltSloganBand } from "../primitives";
import { SembolKitapYildiz } from "../educationSymbols";
import { fontFamilyAl } from "@/lib/logo/logoMetinOlculeri";

export function PremiumShieldLogo({ config, uid }: TemplateProps) {
  const { palette, organization: org } = config;
  const font = fontFamilyAl(config.variant.fontPairId);
  const kisa = org.kisaAd.trim();

  return (
    <LogoSvgRoot config={config}>
      <LogoDefs palette={palette} uid={uid} />
      <Zemin palette={palette} uid={uid} />
      <PremiumKalkanPath palette={palette} uid={uid} top={64} />
      {kisa ? (
        <text x={256} y={108} textAnchor="middle" fill={palette.secondary} fontFamily={font} fontSize={13} fontWeight={700} letterSpacing={2}>
          {kisa.toLocaleUpperCase("tr-TR")}
        </text>
      ) : null}
      <SembolKitapYildiz palette={palette} cx={256} cy={168} size={100} uid={uid} />
      <KalkanAltiBaslik config={config} y={318} anaSize={30} altSize={16} />
      <AltSloganBand config={config} y={400} fontSize={15} />
    </LogoSvgRoot>
  );
}
