import type { AfisTemplateProps } from "../afisPosterShared";
import {
  AfisCanvas,
  AltBant,
  AltIletisimAlani,
  AnaBaslik,
  AltBaslikSatir,
  IcerikPadding,
  KisaAciklama,
  KlasikZemin,
  KurumUst,
  TarihKutusu,
} from "../afisPosterShared";

export function ClassicInfoPoster(props: AfisTemplateProps) {
  const { tema, brief } = props;
  return (
    <AfisCanvas tema={tema}>
      <KlasikZemin tema={tema} />
      <IcerikPadding>
        <KurumUst {...props} />
        <div
          style={{
            marginTop: 12,
            padding: "20px 16px",
            borderRadius: 14,
            background: tema.cardBg,
            border: `2px solid ${tema.primary}22`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          }}
        >
          <AnaBaslik brief={brief} tema={tema} onLight />
          <AltBaslikSatir brief={brief} tema={tema} />
          <TarihKutusu {...props} />
          <KisaAciklama brief={brief} tema={tema} />
        </div>
        <AltIletisimAlani {...props} />
      </IcerikPadding>
      <AltBant brief={brief} tema={tema} />
    </AfisCanvas>
  );
}
