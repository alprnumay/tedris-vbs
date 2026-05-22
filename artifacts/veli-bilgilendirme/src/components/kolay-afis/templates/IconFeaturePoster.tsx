import type { AfisTemplateProps } from "../afisPosterShared";
import {
  AfisCanvas,
  AltBant,
  AltIletisimAlani,
  AnaBaslik,
  AltBaslikSatir,
  GokyuzuDekor,
  IcerikPadding,
  KisaAciklama,
  KurumUst,
  OzellikGrid,
  TarihKutusu,
} from "../afisPosterShared";

export function IconFeaturePoster(props: AfisTemplateProps) {
  const { tema, brief } = props;
  return (
    <AfisCanvas tema={tema}>
      <GokyuzuDekor tema={tema} />
      <IcerikPadding>
        <KurumUst {...props} />
        <AnaBaslik brief={brief} tema={tema} />
        <AltBaslikSatir brief={brief} tema={tema} />
        <TarihKutusu {...props} />
        <KisaAciklama brief={brief} tema={tema} />
        <OzellikGrid {...props} ikonlu />
        <AltIletisimAlani {...props} />
      </IcerikPadding>
      <AltBant brief={brief} tema={tema} />
    </AfisCanvas>
  );
}
