import type { YatiliProgramFormData } from "@/types/yatiliProgram";
import { yatiliLayoutHesapla } from "@/lib/yatili-program/yatiliLayoutMotor";
import { yatiliTemaAl } from "@/lib/yatili-program/yatiliTema";
import { HeroInviteTemplate } from "./templates/HeroInviteTemplate";
import { ProgramFlowTemplate } from "./templates/ProgramFlowTemplate";
import { NightThemeTemplate } from "./templates/NightThemeTemplate";
import { TrustFocusedTemplate } from "./templates/TrustFocusedTemplate";

export function YatiliAfishOnizleme({ data }: { data: YatiliProgramFormData }) {
  const tema = yatiliTemaAl(data.renkTema);
  const layout = yatiliLayoutHesapla(data);
  const props = { data, tema, layout };

  switch (data.sablon) {
    case "program_flow":
      return <ProgramFlowTemplate {...props} />;
    case "night_theme":
      return <NightThemeTemplate {...props} />;
    case "trust_focused":
      return <TrustFocusedTemplate {...props} />;
    case "hero_invite":
    default:
      return <HeroInviteTemplate {...props} />;
  }
}
