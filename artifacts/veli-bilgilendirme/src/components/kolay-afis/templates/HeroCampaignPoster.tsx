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
  SinifSeritleri,
  TarihKutusu,
} from "../afisPosterShared";

export function HeroCampaignPoster(props: AfisTemplateProps) {
  const { tema, brief } = props;
  return (
    <AfisCanvas tema={tema}>
      <GokyuzuDekor tema={tema} />
      <IcerikPadding>
        <KurumUst {...props} />
        <div style={{ marginTop: 8 }}>
          <AnaBaslik brief={brief} tema={tema} buyuk />
          <AltBaslikSatir brief={brief} tema={tema} />
          <SinifSeritleri brief={brief} tema={tema} />
        </div>
        <TarihKutusu {...props} />
        <KisaAciklama brief={brief} tema={tema} />
        <OzellikGrid {...props} ikonlu />
        <AltIletisimAlani {...props} />
      </IcerikPadding>
      <AltBant brief={brief} tema={tema} />
    </AfisCanvas>
  );
}
