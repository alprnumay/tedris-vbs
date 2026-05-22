import type { YatiliTemplateProps } from "../yatiliPosterShared";
import {
  BasvuruQrKutusu,
  DestekGorsel,
  FlexGrow,
  GunlukProgramTimeline,
  KapakGorsel,
  KurumAdiSatir,
  MaddelerListesi,
  PosterCanvas,
  ProgramBaslik,
  SloganSatir,
  TarihRozet,
} from "../yatiliPosterShared";

export function NightThemeTemplate({ data, tema, layout }: YatiliTemplateProps) {
  const dark = true;
  return (
    <PosterCanvas tema={tema} layout={layout}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "22px 20px",
          gap: layout.sectionGap,
          position: "relative",
          zIndex: 1,
        }}
      >
        {layout.visible.kurum ? <KurumAdiSatir data={data} tema={tema} layout={layout} dark style={{ color: tema.accentSoft }} /> : null}
        {layout.visible.baslik ? <ProgramBaslik data={data} tema={tema} layout={layout} dark /> : null}
        <div style={{ textAlign: "center" }}>
          <SloganSatir data={data} tema={tema} layout={layout} dark large />
        </div>
        {layout.visible.tarih ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <TarihRozet data={data} tema={tema} layout={layout} variant="hero" dark />
          </div>
        ) : null}
        <KapakGorsel data={data} tema={tema} layout={layout} dark />
        <DestekGorsel data={data} tema={tema} layout={layout} />
        <FlexGrow flex={layout.spacerOrta * 0.5} />
        <GunlukProgramTimeline data={data} tema={tema} layout={layout} dark />
        {layout.visible.maddeler ? <MaddelerListesi data={data} tema={tema} layout={layout} dark inCard /> : null}
        <FlexGrow flex={layout.spacerOrta * 0.3} />
        <BasvuruQrKutusu data={data} tema={tema} layout={layout} dark />
      </div>
    </PosterCanvas>
  );
}
