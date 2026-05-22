import type { YatiliTemplateProps } from "../yatiliPosterShared";
import {
  BasvuruQrKutusu,
  DekoratifBaslikBandı,
  DestekGorsel,
  FlexGrow,
  GunlukProgramTimeline,
  GuvenMetniKutusu,
  KapakGorsel,
  KisaMetin,
  KurumAdiSatir,
  MaddelerListesi,
  PosterCanvas,
  ProgramBaslik,
  SloganSatir,
  TarihRozet,
  VeliNotSatir,
} from "../yatiliPosterShared";

export function HeroInviteTemplate({ data, tema, layout }: YatiliTemplateProps) {
  const dark = layout.dark;
  const gap = layout.sectionGap;
  return (
    <PosterCanvas tema={tema} layout={layout}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "20px 22px",
          gap,
          position: "relative",
          zIndex: 1,
        }}
      >
        {layout.visible.kurum ? <KurumAdiSatir data={data} tema={tema} layout={layout} dark={dark} /> : null}
        {layout.visible.baslik ? <ProgramBaslik data={data} tema={tema} layout={layout} dark={dark} /> : null}
        {layout.visible.tarih ? <TarihRozet data={data} tema={tema} layout={layout} variant="hero" dark={dark} /> : null}
        <DekoratifBaslikBandı tema={tema} layout={layout} />
        <KapakGorsel data={data} tema={tema} layout={layout} dark={dark} />
        <DestekGorsel data={data} tema={tema} layout={layout} />
        <FlexGrow flex={layout.spacerOrta} />
        {layout.visible.kisaAciklama ? <KisaMetin maxLines={2} dark={dark}>{data.shortIntro}</KisaMetin> : null}
        <GuvenMetniKutusu data={data} tema={tema} layout={layout} dark={dark} />
        <GunlukProgramTimeline data={data} tema={tema} layout={layout} dark={dark} />
        {layout.visible.maddeler ? <MaddelerListesi data={data} tema={tema} layout={layout} dark={dark} /> : null}
        <VeliNotSatir data={data} tema={tema} layout={layout} dark={dark} />
        <SloganSatir data={data} tema={tema} layout={layout} dark={dark} />
        <BasvuruQrKutusu data={data} tema={tema} layout={layout} dark={dark} />
      </div>
    </PosterCanvas>
  );
}
