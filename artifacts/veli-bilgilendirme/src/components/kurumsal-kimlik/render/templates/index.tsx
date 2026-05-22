import type { LogoConfigV1 } from "@/types/logoKimlik";
import { logoUid } from "../logoShared";
import { OfficialSealTemplate } from "./OfficialSealTemplate";
import { MasterShieldTemplate } from "./MasterShieldLogo";
import { HorizontalInstitutionTemplate } from "./HorizontalInstitutionTemplate";
import { MonogramProfileTemplate } from "./MonogramProfileTemplate";

const TEMPLATE_MAP = {
  officialSealTemplate: OfficialSealTemplate,
  premiumShieldTemplate: MasterShieldTemplate,
  horizontalInstitutionTemplate: HorizontalInstitutionTemplate,
  monogramProfileTemplate: MonogramProfileTemplate,
} as const;

export function LogoTemplateRender({ config }: { config: LogoConfigV1 }) {
  const Cmp = TEMPLATE_MAP[config.templateId] ?? OfficialSealTemplate;
  return <Cmp config={config} uid={logoUid(config)} />;
}
