import type { TemplateProps } from "../primitives";
import { LogoSvgRoot, LogoDefs, KalkanAltiBaslik, AltSloganBand } from "../primitives";
import { SembolKampRozet } from "../educationSymbols";
import { kurumBaslikHiyerarsi, fontFamilyAl } from "@/lib/logo/logoMetinOlculeri";

export function CampEventBadgeLogo({ config, uid }: TemplateProps) {
  const { palette, organization: org } = config;
  const font = fontFamilyAl(config.variant.fontPairId);
  const { ana } = kurumBaslikHiyerarsi(org.kurumAdi);

  return (
    <LogoSvgRoot config={config}>
      <LogoDefs palette={palette} uid={uid} />
      <rect width={512} height={512} fill={palette.accent} />
      <polygon
        points="256,64 432,148 396,380 116,380 80,148"
        fill={palette.primary}
        stroke={palette.secondary}
        strokeWidth={5}
        filter={`url(#${uid}-sh)`}
      />
      <polygon points="256,92 400,158 372,352 140,352 112,158" fill={palette.accent} />
      <text x={256} y={135} textAnchor="middle" fill={palette.primary} fontFamily={font} fontSize={22} fontWeight={800}>
        {ana.toLocaleUpperCase("tr-TR")}
      </text>
      <SembolKampRozet palette={palette} cx={256} cy={248} uid={uid} />
      {org.kurulusYili.trim() ? (
        <text x={256} y={330} textAnchor="middle" fill={palette.primary} fontFamily={font} fontSize={17} fontWeight={700}>
          {org.kurulusYili}
        </text>
      ) : null}
      <KalkanAltiBaslik config={config} x={256} y={388} anaSize={24} altSize={13} />
      <AltSloganBand config={config} y={448} fontSize={13} />
    </LogoSvgRoot>
  );
}
