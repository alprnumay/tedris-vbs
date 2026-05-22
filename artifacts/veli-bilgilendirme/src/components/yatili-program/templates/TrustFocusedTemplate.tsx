import type { YatiliTemplateProps } from "../yatiliPosterShared";
import {
  BasvuruQrKutusu,
  DekoratifBaslikBandı,
  DestekGorsel,
  FlexGrow,
  GunlukProgramTimeline,
  GuvenMetniKutusu,
  KisaMetin,
  KurumAdiSatir,
  MaddelerListesi,
  PosterCanvas,
  ProgramBaslik,
  SloganSatir,
  TarihRozet,
  VeliNotSatir,
} from "../yatiliPosterShared";

export function TrustFocusedTemplate({ data, tema, layout }: YatiliTemplateProps) {
  const dark = layout.dark;
  return (
    <PosterCanvas tema={tema} layout={layout}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "18px 20px",
          gap: layout.sectionGap,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flex: 1 }}>
            {layout.visible.kurum ? <KurumAdiSatir data={data} tema={tema} layout={layout} dark={dark} /> : null}
            {layout.visible.baslik ? <ProgramBaslik data={data} tema={tema} layout={layout} dark={dark} size="md" /> : null}
          </div>
          {layout.visible.tarih ? <TarihRozet data={data} tema={tema} layout={layout} dark={dark} /> : null}
        </div>
        <DekoratifBaslikBandı tema={tema} layout={layout} />
        <GuvenMetniKutusu data={data} tema={tema} layout={layout} dark={dark} />
        <VeliNotSatir data={data} tema={tema} layout={layout} dark={dark} />
        <FlexGrow flex={layout.spacerOrta * 0.35} />
        <div style={{ display: "grid", gridTemplateColumns: layout.visible.gorsel && data.gorselModu === "kucuk_destek" ? "88px 1fr" : "1fr", gap: 12 }}>
          <DestekGorsel data={data} tema={tema} layout={layout} />
          <div style={{ display: "flex", flexDirection: "column", gap: layout.sectionGap }}>
            {layout.visible.kisaAciklama ? <KisaMetin maxLines={2}>{data.shortIntro}</KisaMetin> : null}
            <GunlukProgramTimeline data={data} tema={tema} layout={layout} dark={dark} />
            <MaddelerListesi data={data} tema={tema} layout={layout} dark={dark} />
          </div>
        </div>
        <SloganSatir data={data} tema={tema} layout={layout} dark={dark} />
        <FlexGrow flex={layout.spacerAlt} />
        <BasvuruQrKutusu data={data} tema={tema} layout={layout} dark={dark} />
      </div>
    </PosterCanvas>
  );
}
