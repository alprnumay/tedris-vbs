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

/** Dergi sayfası — masthead + iki sütun metin + yan görsel sütunu */
export default function SablonDergiSayfasi({ form, tarih }: TemplateProps) {
  const baslik = posterBaslik(form);
  const photos = form.gorseller.slice(0, 3);
  const items = activeFaaliyetler(form);
  const metin = clampMetin(form.posterMetni, 500);
  const half = Math.ceil(metin.length / 2);
  const col1 = metin.slice(0, half);
  const col2 = metin.slice(half);

  return (
    <TemplateShell style={{ background: "#fafafa", color: "#18181b", padding: "18px 20px 14px" }}>
      <div style={{ borderBottom: "4px double #18181b", paddingBottom: 10, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: ".2em" }}>{form.kurumAdi || "KURUM BÜLTENİ"}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#71717a" }}>{tarih}</span>
        </div>
        <h1 data-template-title style={{ margin: "10px 0 0", fontSize: 26, fontWeight: 900, lineHeight: 1.15, letterSpacing: "-.03em" }}>
          {baslik}
        </h1>
      </div>

      <TemplateBody style={{ display: "flex", gap: 12, paddingTop: 12, minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
          {items.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flexShrink: 0 }}>
              {items.slice(0, 4).map((f, i) => (
                <div key={i} style={{ borderTop: "2px solid #18181b", paddingTop: 6 }}>
                  <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".06em" }}>{f.tur || "Konu"}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{f.alan}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, columnRule: "1px solid #d4d4d8" }}>
            <DescBlock text={col1 || "—"} fontSize={10.5} maxLines={12} color="#3f3f46" />
            <DescBlock text={col2 || " "} fontSize={10.5} maxLines={12} color="#3f3f46" />
          </div>
        </div>

        <div style={{ width: 108, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {photos.length > 0
            ? photos.map((p, i) => (
                <div key={i} style={{ border: "1px solid #d4d4d8", padding: 4, background: "#fff" }}>
                  <PosterImg src={p} height={i === 0 ? 88 : 64} radius={0} />
                  <div style={{ fontSize: 8, fontWeight: 700, marginTop: 4, color: "#71717a" }}>Görsel {i + 1}</div>
                </div>
              ))
            : [0, 1].map((i) => <EmptyPhotoSlot key={i} height={72} accent="#71717a" />)}
        </div>
      </TemplateBody>

      <TemplateFooter form={form} tarih={tarih} accent="#18181b" />
    </TemplateShell>
  );
}
