import type { AfisTemplateProps } from "../afisPosterShared";
import {
  AfisCanvas,
  AltBant,
  AltIletisimAlani,
  AnaBaslik,
  IcerikPadding,
  KisaAciklama,
  KlasikZemin,
  KurumUst,
  OzellikGrid,
  TarihKutusu,
} from "../afisPosterShared";

export function ProgramFlowPoster(props: AfisTemplateProps) {
  const { tema, brief, form } = props;
  const akis = brief.metin.featureItems;
  return (
    <AfisCanvas tema={tema}>
      <KlasikZemin tema={tema} />
      <IcerikPadding>
        <KurumUst {...props} />
        <AnaBaslik brief={brief} tema={tema} onLight />
        <TarihKutusu {...props} />
        {brief.bloklar.programAkisi && akis.length > 0 ? (
          <div style={{ marginTop: 14 }}>
            <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: tema.primary }}>
              PROGRAM AKIŞI
            </p>
            {akis.map((etk, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: tema.cardBg,
                  borderLeft: `4px solid ${tema.accent}`,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: tema.primary, minWidth: 28 }}>{i + 1}.</span>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{etk}</span>
              </div>
            ))}
          </div>
        ) : (
          <OzellikGrid {...props} ikonlu={false} />
        )}
        <KisaAciklama brief={brief} tema={tema} />
        <AltIletisimAlani {...props} />
      </IcerikPadding>
      <AltBant brief={brief} tema={tema} />
    </AfisCanvas>
  );
}
