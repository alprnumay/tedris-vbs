import type { TemplateProps } from "../logoShared";
import { SvgKok, LogoPremiumDefs } from "../logoShared";
import { fontFamilyAl, fitMonogramSize, fitTextSize, monogramHarfleri, uppercaseTr } from "@/lib/logo/logoMetinOlculeri";

const MONO_CY = 250;
const INSTITUTION_Y = 335;

export function MonogramProfileTemplate({ config, uid }: TemplateProps) {
  const p = config.palette;
  const org = config.organization;
  const mono = uppercaseTr(org.kisaAd.trim() || monogramHarfleri(org.kurumAdi, org.kisaAd, 5));
  const tamAd = uppercaseTr(org.kurumAdi);
  const monoFs = fitMonogramSize(mono);
  const adFs = fitTextSize(tamAd, 17, 13, 36);

  return (
    <SvgKok viewBox="0 0 512 512" label={org.kurumAdi || "Monogram Profil"}>
      <LogoPremiumDefs palette={p} uid={uid} />
      <rect width={512} height={512} fill={p.primaryDark} />
      <circle cx={256} cy={MONO_CY} r={198} fill="none" stroke={p.secondary} strokeWidth={11} />
      <circle cx={256} cy={MONO_CY} r={178} fill={`url(#${uid}-cream)`} stroke={p.primary} strokeWidth={5} />
      <circle cx={256} cy={MONO_CY} r={152} fill="none" stroke={p.secondary} strokeWidth={3} opacity={0.65} />
      <text
        x={256}
        y={MONO_CY + 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={p.primaryDark}
        fontFamily={fontFamilyAl("klasik_serif")}
        fontSize={monoFs}
        fontWeight={800}
        letterSpacing={mono.length <= 3 ? 10 : 5}
        stroke={p.secondary}
        strokeWidth={2}
        paintOrder="stroke fill"
        filter={`url(#${uid}-sh)`}
      >
        {mono}
      </text>
      {tamAd ? (
        <text
          x={256}
          y={INSTITUTION_Y}
          textAnchor="middle"
          fill={p.primary}
          fontFamily={fontFamilyAl("sade_minimal")}
          fontSize={adFs}
          fontWeight={600}
          letterSpacing={1.2}
        >
          {tamAd.length > 42 ? `${tamAd.slice(0, 40)}…` : tamAd}
        </text>
      ) : null}
    </SvgKok>
  );
}
