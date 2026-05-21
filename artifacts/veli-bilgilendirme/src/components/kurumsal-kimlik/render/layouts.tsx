import type { LogoConfigV1 } from "@/types/logoKimlik";
import { kurumAdiSatirlari, monogramHarfleri, fontFamilyAl } from "@/lib/logo/logoMetinOlculeri";
import { LogoShapeFrame } from "./shapes";
import { LogoSymbolIcon } from "./symbols";

const GRUP_ETIKET: Record<string, string> = {
  en_kurumsal: "En kurumsal",
  daha_modern: "Daha modern",
  daha_sade: "Daha sade",
  daha_ayirt_edici: "Daha ayırt edici",
};

export function grupEtiketi(id: string): string {
  return GRUP_ETIKET[id] ?? id;
}

interface LogoRendererProps {
  config: LogoConfigV1;
  size?: number;
  className?: string;
}

export function LogoRenderer({ config, size = 512, className }: LogoRendererProps) {
  const { palette, variant, display, organization: org } = config;
  const font = fontFamilyAl(variant.fontPairId);
  const adSatirlari = kurumAdiSatirlari(org.kurumAdi);
  const monogram = monogramHarfleri(org.kurumAdi, org.kisaAd);
  const showIcon =
    config.visualDirection !== "wordmark" &&
    variant.layoutId !== "monogram_merkez" &&
    config.category !== "monogram";
  const showMonogram =
    config.visualDirection === "monogram" ||
    variant.layoutId === "monogram_merkez" ||
    config.category === "monogram";

  const altMetin = [
    display.showTagline && org.slogan.trim() ? org.slogan.trim() : null,
    display.showCity && org.sehir.trim()
      ? [org.sehir, org.ilce].filter(Boolean).join(" / ")
      : null,
    display.showYear && org.kurulusYili.trim() ? `Kuruluş ${org.kurulusYili}` : null,
  ].filter(Boolean) as string[];

  const titleY =
    variant.layoutId === "merkez_alt_slogan" ? 118 : variant.layoutId === "monogram_merkez" ? 340 : 96;
  const iconY = variant.layoutId === "merkez_ust_ad" ? 268 : 248;

  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={org.kurumAdi || "Logo önizleme"}
    >
      <rect width={512} height={512} fill={palette.accent} />
      <LogoShapeFrame shapeId={variant.shapeId} borderId={variant.borderId} palette={palette} />

      {variant.ornamentId === "ust_cizgi" ? (
        <line x1={140} y1={88} x2={372} y2={88} stroke={palette.secondary} strokeWidth={2} />
      ) : null}
      {variant.ornamentId === "alt_cizgi" ? (
        <line x1={140} y1={424} x2={372} y2={424} stroke={palette.secondary} strokeWidth={2} />
      ) : null}
      {variant.ornamentId === "kose_nokta" ? (
        <>
          <circle cx={148} cy={148} r={4} fill={palette.secondary} />
          <circle cx={364} cy={148} r={4} fill={palette.secondary} />
          <circle cx={148} cy={364} r={4} fill={palette.secondary} />
          <circle cx={364} cy={364} r={4} fill={palette.secondary} />
        </>
      ) : null}

      {showMonogram ? (
        <text
          x={256}
          y={268}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={palette.primary}
          fontFamily={font}
          fontSize={showMonogram && !showIcon ? 96 : 72}
          fontWeight={700}
        >
          {monogram}
        </text>
      ) : showIcon ? (
        <g transform={`translate(0, ${variant.layoutId === "merkez_ust_ad" ? 24 : 0})`}>
          <LogoSymbolIcon iconId={variant.iconId} palette={palette} size={88} />
        </g>
      ) : null}

      {showIcon && showMonogram && config.visualDirection === "combined" ? (
        <text
          x={256}
          y={iconY + 72}
          textAnchor="middle"
          fill={palette.primary}
          fontFamily={font}
          fontSize={36}
          fontWeight={700}
        >
          {monogram}
        </text>
      ) : null}

      {!showMonogram || config.visualDirection === "combined" ? (
        <>
          {adSatirlari.map((satir, i) => (
            <text
              key={i}
              x={256}
              y={titleY + i * (32 * display.titleScale)}
              textAnchor="middle"
              fill={palette.text}
              fontFamily={font}
              fontSize={28 * display.titleScale}
              fontWeight={700}
            >
              {satir}
            </text>
          ))}
        </>
      ) : null}

      {altMetin.length > 0 ? (
        <text
          x={256}
          y={variant.layoutId === "merkez_alt_slogan" ? 400 : 430}
          textAnchor="middle"
          fill={palette.muted}
          fontFamily={font}
          fontSize={14}
          fontWeight={500}
        >
          {altMetin[0]}
        </text>
      ) : null}
      {altMetin.length > 1 ? (
        <text
          x={256}
          y={448}
          textAnchor="middle"
          fill={palette.muted}
          fontFamily={font}
          fontSize={12}
          opacity={0.85}
        >
          {altMetin.slice(1).join(" · ")}
        </text>
      ) : null}
    </svg>
  );
}
