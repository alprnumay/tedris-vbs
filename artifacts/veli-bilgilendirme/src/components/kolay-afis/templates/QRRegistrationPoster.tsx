import { KayitQrImage } from "@/components/deneme/KayitQrImage";
import type { AfisTemplateProps } from "../afisPosterShared";
import {
  AfisCanvas,
  AltBant,
  AnaBaslik,
  IcerikPadding,
  KlasikZemin,
  KurumUst,
  TarihKutusu,
} from "../afisPosterShared";

export function QRRegistrationPoster(props: AfisTemplateProps) {
  const { tema, brief, form } = props;
  return (
    <AfisCanvas tema={tema}>
      <KlasikZemin tema={tema} />
      <IcerikPadding style={{ alignItems: "center", textAlign: "center" }}>
        <KurumUst {...props} />
        <AnaBaslik brief={brief} tema={tema} buyuk onLight />
        <TarihKutusu {...props} />
        {form.qrLink.trim() ? (
          <div
            style={{
              marginTop: 20,
              padding: 20,
              borderRadius: 16,
              background: tema.cardBg,
              boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <KayitQrImage url={form.qrLink} size={140} />
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: tema.primaryDark, maxWidth: 280 }}>
              {brief.metin.callToAction}
            </p>
          </div>
        ) : null}
        {form.telefon.trim() ? (
          <p style={{ marginTop: 16, fontSize: 14, fontWeight: 800, color: tema.primary }}>📞 {form.telefon}</p>
        ) : null}
      </IcerikPadding>
      <AltBant brief={brief} tema={tema} />
    </AfisCanvas>
  );
}
