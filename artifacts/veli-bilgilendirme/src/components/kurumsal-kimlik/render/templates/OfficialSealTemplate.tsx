import type { TemplateProps } from "../logoShared";
import {
  SvgKok,
  LogoPremiumDefs,
  EducationTorchBookMark,
  UstDuzKavisMetin,
  KurumAdiBlok,
  SloganBlok,
  KonumBlok,
} from "../logoShared";

/** Güvenli bölgeler — sembol y≤275, metin y≥305 */
const CX = 256;
const SYMBOL_CY = 198;
const SYMBOL_SCALE = 1.02;

export function OfficialSealTemplate({ config, uid }: TemplateProps) {
  const p = config.palette;
  const org = config.organization;

  return (
    <SvgKok viewBox="0 0 512 512" label={org.kurumAdi || "Resmi Kurum Mührü"}>
      <LogoPremiumDefs palette={p} uid={uid} />
      <circle cx={CX} cy={256} r={155} fill={`url(#${uid}-cream)`} opacity={0.45} />
      <circle cx={CX} cy={256} r={220} fill="none" stroke={p.primaryDark} strokeWidth={14} />
      <circle cx={CX} cy={256} r={202} fill="none" stroke={p.secondary} strokeWidth={5} />
      <circle cx={CX} cy={256} r={172} fill="none" stroke={p.primary} strokeWidth={3.5} />
      <UstDuzKavisMetin config={config} y={105} />
      <EducationTorchBookMark cx={CX} cy={SYMBOL_CY} scale={SYMBOL_SCALE} palette={p} uid={uid} />
      <KurumAdiBlok config={config} x={CX} y={305} secondaryY={333} anaSize={28} altSize={17} minLineGap={24} />
      <SloganBlok config={config} x={CX} y={362} fontSize={14} />
      <KonumBlok config={config} x={CX} y={388} fontSize={12} />
    </SvgKok>
  );
}
