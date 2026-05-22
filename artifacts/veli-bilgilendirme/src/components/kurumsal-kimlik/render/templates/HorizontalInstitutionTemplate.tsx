import type { TemplateProps } from "../logoShared";
import {
  SvgKok,
  LogoPremiumDefs,
  SmallSealMark,
  KurumAdiBlok,
  SloganBlok,
  KonumBlok,
} from "../logoShared";

/** Sol amblem 70,60 180×180 — metin x=285 */
const TEXT_X = 285;
const PRIMARY_Y = 105;
const SECONDARY_Y = 150;
const SEPARATOR_Y = 178;
const SLOGAN_Y = 215;
const LOCATION_Y = 248;

export function HorizontalInstitutionTemplate({ config, uid }: TemplateProps) {
  const p = config.palette;
  const org = config.organization;

  return (
    <SvgKok viewBox="0 0 900 300" label={org.kurumAdi || "Modern Yatay Kurum Logosu"}>
      <LogoPremiumDefs palette={p} uid={uid} />
      <rect width={900} height={300} fill={p.accent} />
      <SmallSealMark cx={160} cy={150} size={180} palette={p} uid={uid} />
      <line x1={268} y1={88} x2={268} y2={222} stroke={p.secondary} strokeWidth={5} />
      <KurumAdiBlok
        config={config}
        x={TEXT_X}
        y={PRIMARY_Y}
        secondaryY={SECONDARY_Y}
        anaSize={52}
        altSize={26}
        align="start"
        minLineGap={26}
      />
      <rect x={TEXT_X} y={SEPARATOR_Y} width={440} height={5} fill={p.secondary} rx={2} />
      <SloganBlok config={config} x={TEXT_X} y={SLOGAN_Y} fontSize={22} align="start" bold />
      <KonumBlok config={config} x={TEXT_X} y={LOCATION_Y} fontSize={17} align="start" />
    </SvgKok>
  );
}
