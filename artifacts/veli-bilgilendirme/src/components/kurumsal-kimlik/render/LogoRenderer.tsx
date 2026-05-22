import type { CSSProperties } from "react";
import type { LogoConfigV1 } from "@/types/logoKimlik";
import { templateEtiketi, templateGrupEtiketi } from "@/lib/logo/logoTemplates";
import { LogoTemplateRender } from "./templates";

interface LogoRendererProps {
  config: LogoConfigV1;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function logoYatayMi(templateId: LogoConfigV1["templateId"]): boolean {
  return templateId === "horizontalInstitutionTemplate";
}

export function logoKalkanMi(templateId: LogoConfigV1["templateId"]): boolean {
  return templateId === "premiumShieldTemplate";
}

export function LogoRenderer({ config, size = 512, className, style }: LogoRendererProps) {
  const yatay = logoYatayMi(config.templateId);
  const kalkan = logoKalkanMi(config.templateId);
  const width = size;
  const height = yatay
    ? Math.round(size * (300 / 900))
    : kalkan
      ? Math.round(size * (920 / 720))
      : size;

  return (
    <div className={className} style={{ width, height, maxWidth: "100%", ...style }}>
      <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full">
        <LogoTemplateRender config={config} />
      </div>
    </div>
  );
}

export function grupEtiketi(id: string): string {
  const map: Record<string, string> = {
    en_kurumsal: "En kurumsal",
    daha_modern: "Daha modern",
    daha_sade: "Daha sade",
    daha_ayirt_edici: "Daha ayırt edici",
  };
  return map[id] ?? id;
}

export function templateTarzEtiketi(config: LogoConfigV1): string {
  return templateEtiketi(config.templateId);
}

export { templateGrupEtiketi };
