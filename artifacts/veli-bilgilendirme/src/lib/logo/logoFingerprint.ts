import type { LogoConfigV1 } from "@/types/logoKimlik";

export function logoFingerprintOlustur(config: Pick<LogoConfigV1, "category" | "variant" | "colorTheme">): string {
  const v = config.variant;
  return [
    config.category,
    v.shapeId,
    v.borderId,
    v.iconId,
    v.layoutId,
    v.fontPairId,
    v.ornamentId,
    config.colorTheme,
  ].join("|");
}
