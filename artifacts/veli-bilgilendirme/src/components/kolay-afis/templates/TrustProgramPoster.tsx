import type { AfisTemplateProps } from "../afisPosterShared";
import {
  AfisCanvas,
  AltBant,
  AltIletisimAlani,
  AnaBaslik,
  AltBaslikSatir,
  GuvenKutusu,
  IcerikPadding,
  KisaAciklama,
  KlasikZemin,
  KurumUst,
  OzellikGrid,
  TarihKutusu,
} from "../afisPosterShared";

export function TrustProgramPoster(props: AfisTemplateProps) {
  const { tema, brief } = props;
  return (
    <AfisCanvas tema={tema}>
      <KlasikZemin tema={tema} />
      <IcerikPadding>
        <KurumUst {...props} />
        <AnaBaslik brief={brief} tema={tema} onLight />
        <AltBaslikSatir brief={brief} tema={tema} />
        <TarihKutusu {...props} />
        <GuvenKutusu brief={brief} tema={tema} />
        <KisaAciklama brief={brief} tema={tema} />
        <OzellikGrid {...props} ikonlu={false} />
        <AltIletisimAlani {...props} />
      </IcerikPadding>
      <AltBant brief={brief} tema={tema} />
    </AfisCanvas>
  );
}
