import {
  clampMetin,
  DescBlock,
  EmptyPhotoSlot,
  PosterImg,
  posterBaslik,
  TemplateBody,
  TemplateFooter,
  TemplateProps,
  TemplateShell,
} from "../../lib/sablonlar/templateShared";

/** Fotoğraf albümü — büyük + 3 küçük grid, az metin */
export default function SablonFotoAlbumu({ form, tarih }: TemplateProps) {
  const baslik = posterBaslik(form);
  const photos = form.gorseller.slice(0, 4);
  const hero = photos[0];
  const thumbs = photos.slice(1, 4);

  return (
    <TemplateShell style={{ background: "#0f172a", color: "#f8fafc", padding: 16 }}>
      <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: ".14em", color: "#38bdf8", marginBottom: 4 }}>FOTOĞRAF ALBÜMÜ</div>
      <h1 data-template-title style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 900, lineHeight: 1.2 }}>{baslik}</h1>

      <TemplateBody style={{ gap: 8, minHeight: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 8, flexShrink: 0, minHeight: 0 }}>
          <div style={{ borderRadius: 14, overflow: "hidden", minHeight: 0 }}>
            {hero ? <PosterImg src={hero} height={200} radius={0} /> : <EmptyPhotoSlot label="Ana fotoğraf" height={200} accent="#38bdf8" />}
          </div>
          <div style={{ display: "grid", gridTemplateRows: "repeat(3, 1fr)", gap: 6 }}>
            {[0, 1, 2].map((i) =>
              thumbs[i] ? (
                <div key={i} style={{ borderRadius: 10, overflow: "hidden" }}>
                  <PosterImg src={thumbs[i]} height={62} radius={0} />
                </div>
              ) : (
                <EmptyPhotoSlot key={i} height={62} accent="#334155" />
              ),
            )}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, background: "rgba(255,255,255,.06)", borderRadius: 12, padding: 12, border: "1px solid rgba(255,255,255,.1)" }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: "#38bdf8", marginBottom: 6 }}>VELİ NOTU</div>
          <DescBlock text={clampMetin(form.posterMetni || form.ekNot, 320)} fontSize={11.5} maxLines={5} color="rgba(248,250,252,.88)" />
        </div>
      </TemplateBody>

      <TemplateFooter form={form} tarih={tarih} dark accent="#38bdf8" />
    </TemplateShell>
  );
}
