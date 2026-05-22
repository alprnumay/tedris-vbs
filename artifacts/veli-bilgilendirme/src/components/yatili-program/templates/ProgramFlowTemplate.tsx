import type { YatiliTemplateProps } from "../yatiliPosterShared";
import {
  BasvuruQrKutusu,
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
  TarihRozet,
  VeliNotSatir,
} from "../yatiliPosterShared";

export function ProgramFlowTemplate({ data, tema, layout }: YatiliTemplateProps) {
  const dark = layout.dark;
  return (
    <PosterCanvas tema={tema} layout={layout}>
      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ background: tema.gradient, padding: "16px 20px", color: "#fff" }}>
          {layout.visible.kurum ? (
            <KurumAdiSatir data={data} tema={tema} layout={layout} dark={true} style={{ color: tema.accentSoft }} />
          ) : null}
          {layout.visible.baslik ? <ProgramBaslik data={data} tema={tema} layout={layout} dark size="md" /> : null}
          {layout.visible.tarih ? <TarihRozet data={data} tema={tema} layout={layout} variant="ribbon" dark /> : null}
        </div>

        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <div
            style={{
              flex: layout.gunlukMerkez ? 0.9 : 1,
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: layout.sectionGap,
            }}
          >
            <KapakGorsel data={data} tema={tema} layout={layout} />
            <DestekGorsel data={data} tema={tema} layout={layout} />
            {layout.visible.kisaAciklama ? <KisaMetin maxLines={3}>{data.shortIntro}</KisaMetin> : null}
            <GuvenMetniKutusu data={data} tema={tema} layout={layout} dark={dark} />
            <VeliNotSatir data={data} tema={tema} layout={layout} dark={dark} />
            <FlexGrow flex={layout.spacerOrta * 0.6} />
          </div>
          <div
            style={{
              flex: layout.maddelerGenis ? 1.25 : 1.1,
              padding: "14px 18px 14px 10px",
              background: `linear-gradient(180deg, ${tema.accentSoft}55, transparent)`,
              display: "flex",
              flexDirection: "column",
              gap: layout.sectionGap,
            }}
          >
            <GunlukProgramTimeline data={data} tema={tema} layout={layout} dark={dark} />
            {layout.visible.maddeler ? (
              <>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: tema.primary }}>PROGRAM</p>
                <MaddelerListesi data={data} tema={tema} layout={layout} dark={dark} inCard />
              </>
            ) : null}
            <FlexGrow flex={layout.spacerOrta * 0.4} />
          </div>
        </div>

        <div style={{ padding: "12px 18px 18px" }}>
          <BasvuruQrKutusu data={data} tema={tema} layout={layout} dark={dark} />
        </div>
      </div>
    </PosterCanvas>
  );
}
