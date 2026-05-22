import type { AfisBrief, KolayAfisForm } from "@/types/kolayAfis";
import { temaAl } from "@/lib/kolay-afis/afisTemaSistemi";
import { ClassicInfoPoster } from "./templates/ClassicInfoPoster";
import { HeroCampaignPoster } from "./templates/HeroCampaignPoster";
import { IconFeaturePoster } from "./templates/IconFeaturePoster";
import { ProgramFlowPoster } from "./templates/ProgramFlowPoster";
import { QRRegistrationPoster } from "./templates/QRRegistrationPoster";
import { TrustProgramPoster } from "./templates/TrustProgramPoster";

export function AfisPosterRender({
  form,
  brief,
  ikonluMaddeler = true,
}: {
  form: KolayAfisForm;
  brief: AfisBrief;
  ikonluMaddeler?: boolean;
}) {
  const tema = temaAl(brief.tema);
  const props = { form, brief, tema, ikonlu: ikonluMaddeler && brief.ozellikIkonlu };

  switch (brief.aile) {
    case "hero_campaign":
      return <HeroCampaignPoster {...props} />;
    case "trust_program":
      return <TrustProgramPoster {...props} />;
    case "program_flow":
      return <ProgramFlowPoster {...props} />;
    case "icon_feature":
      return <IconFeaturePoster {...props} />;
    case "qr_registration":
      return <QRRegistrationPoster {...props} />;
    case "classic_info":
    default:
      return <ClassicInfoPoster {...props} />;
  }
}
