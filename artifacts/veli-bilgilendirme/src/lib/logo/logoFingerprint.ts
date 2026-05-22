import type { LogoConfigV1 } from "@/types/logoKimlik";

export function logoFingerprintOlustur(
  config: Pick<LogoConfigV1, "category" | "templateId" | "colorTheme" | "organization" | "seed" | "lego">,
): string {
  const org = config.organization.kurumAdi.trim().slice(0, 24);
  const legoKey = config.lego ? `${config.lego.shieldId}:${config.lego.emblemId}` : "";
  return [config.category, config.templateId, config.colorTheme, org, config.seed, legoKey].join("|");
}
