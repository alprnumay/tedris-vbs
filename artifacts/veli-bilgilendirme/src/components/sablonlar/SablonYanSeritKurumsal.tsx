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
} from "../../lib/sablonlar/templateShared";

/** Yan şerit kurumsal — sol dikey panel + asimetrik içerik */
export default function SablonYanSeritKurumsal({ form, tarih }: TemplateProps) {
  const baslik = posterBaslik(form);
  const items = activeFaaliyetler(form);
  const photos = form.gorseller.slice(0, 2);

  return (
    <TemplateShell style={{ background: "#fff", flexDirection: "row", padding: 0, overflow: "hidden" }}>
      <div
        style={{
          width: 76,
          flexShrink: 0,
          background: "linear-gradient(180deg,#1e3a8a,#1d4ed8)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "18px 10px",
          alignItems: "center",
        }}
      >
        <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 10, fontWeight: 900, letterSpacing: ".12em", textAlign: "center" }}>
          {form.kurumAdi || "KURUM"}
        </div>
        <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 9, fontWeight: 700, opacity: 0.85, textAlign: "center" }}>
          {tarih}
        </div>
        <div style={{ width: 28, height: 28, borderRadius: 999, border: "2px solid rgba(255,255,255,.5)", display: "grid", placeItems: "center", fontSize: 8, fontWeight: 900 }}>
          VBS
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", padding: "16px 18px 14px", minHeight: 0 }}>
        <h1 data-template-title style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: "#1e3a8a", lineHeight: 1.15 }}>{baslik}</h1>

        <TemplateBody style={{ display: "grid", gridTemplateColumns: photos[0] ? "1fr 110px" : "1fr", gap: 12, minHeight: 0 }}>
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
            {items.slice(0, 2).map((f, i) => (
              <div key={i} style={{ borderLeft: "3px solid #2563eb", paddingLeft: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: "#2563eb" }}>{f.tur || `Bölüm ${i + 1}`}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{f.alan}</div>
              </div>
            ))}
            <div style={{ flex: 1, minHeight: 0 }}>
              <DescBlock text={clampMetin(form.posterMetni, 400)} fontSize={11.5} maxLines={7} />
            </div>
          </div>

          {photos[0] ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <PosterImg src={photos[0]} height={photos[1] ? 100 : 160} radius={12} />
              {photos[1] && <PosterImg src={photos[1]} height={72} radius={10} />}
            </div>
          ) : (
            <EmptyPhotoSlot height={120} accent="#2563eb" />
          )}
        </TemplateBody>

        <TemplateFooter form={form} tarih={tarih} accent="#1d4ed8" />
      </div>
    </TemplateShell>
  );
}
