import {
  activeFaaliyetler,
  clampMetin,
  DescBlock,
  EmptyPhotoSlot,
  PosterImg,
  posterBaslik,
  TemplateBody,
  TemplateFooter,
  TemplateProps,
  TemplateShell,
  TitleBlock,
} from "../../lib/sablonlar/templateShared";

/** Kolaj bülten — sağ/üst çoklu foto + etiket, sol/altta metin blokları */
export default function SablonKolajBulten({ form, tarih }: TemplateProps) {
  const baslik = posterBaslik(form);
  const photos = form.gorseller.slice(0, 5);
  const items = activeFaaliyetler(form);
  const labels = items.map((f) => f.tur || f.alan).filter(Boolean);

  return (
    <TemplateShell style={{ background: "#fff7ed", color: "#431407", padding: 16 }}>
      <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: ".12em", color: "#c2410c", marginBottom: 6 }}>KOLAJ BÜLTEN</div>
      <TitleBlock form={form} baslik={baslik} accent="#ea580c" size={22} />

      <TemplateBody style={{ gap: 10, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 8, flexShrink: 0, minHeight: 0 }}>
          <div style={{ display: "grid", gridTemplateRows: photos[0] ? "1.2fr 1fr" : "auto", gap: 6, minHeight: 0 }}>
            {photos[0] ? (
              <div style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
                <PosterImg src={photos[0]} height={110} radius={0} />
                {labels[0] && (
                  <span style={{ position: "absolute", left: 8, bottom: 8, background: "#ea580c", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 6 }}>
                    {labels[0]}
                  </span>
                )}
              </div>
            ) : (
              <EmptyPhotoSlot label="Kapak görseli" height={110} accent="#ea580c" />
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[1, 2].map((i) =>
                photos[i] ? (
                  <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden" }}>
                    <PosterImg src={photos[i]} height={72} radius={0} />
                    {labels[i] && (
                      <span style={{ position: "absolute", left: 4, bottom: 4, background: "rgba(234,88,12,.92)", color: "#fff", fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>
                        {labels[i]}
                      </span>
                    )}
                  </div>
                ) : (
                  <EmptyPhotoSlot key={i} height={72} accent="#fdba74" />
                ),
              )}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 0 }}>
            {[3, 4].map((i) =>
              photos[i] ? (
                <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", flex: 1 }}>
                  <PosterImg src={photos[i]} height={i === 3 ? 92 : 88} radius={0} />
                  {labels[i] && (
                    <span style={{ position: "absolute", right: 6, top: 6, background: "#9a3412", color: "#fff", fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>
                      {labels[i]}
                    </span>
                  )}
                </div>
              ) : (
                <EmptyPhotoSlot key={i} height={88} accent="#fdba74" />
              ),
            )}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
          {items.slice(0, 3).map((f, i) => (
            <div key={i} style={{ borderLeft: "4px solid #ea580c", paddingLeft: 10, flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: "#c2410c", textTransform: "uppercase" }}>{f.tur || `Faaliyet ${i + 1}`}</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{f.alan}</div>
              {f.ozelNot && <div style={{ fontSize: 10, color: "#78716c" }}>{f.ozelNot}</div>}
            </div>
          ))}
          <div style={{ flex: 1, minHeight: 0, background: "#fff", borderRadius: 12, padding: 12, border: "1px solid #fed7aa" }}>
            <DescBlock text={clampMetin(form.posterMetni, 420)} fontSize={11.5} maxLines={5} color="#57534e" />
          </div>
        </div>
      </TemplateBody>

      <TemplateFooter form={form} tarih={tarih} accent="#ea580c" />
    </TemplateShell>
  );
}
