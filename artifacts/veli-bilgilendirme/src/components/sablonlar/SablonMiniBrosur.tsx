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

/** Mini broşür — katlanmış broşür / 3 panel + alt çağrı */
export default function SablonMiniBrosur({ form, tarih }: TemplateProps) {
  const baslik = posterBaslik(form);
  const items = activeFaaliyetler(form);
  const photo = form.gorseller[0];
  const panels = [
    { baslik: "Program", metin: items[0] ? `${items[0].tur} · ${items[0].alan}` : clampMetin(form.posterMetni, 80) },
    { baslik: "Detay", metin: items[1] ? `${items[1].tur} · ${items[1].alan}` : clampMetin(form.posterMetni, 80) },
    { baslik: "Veli Bilgisi", metin: clampMetin(form.posterMetni, 90) },
  ];

  return (
    <TemplateShell style={{ background: "#fff", color: "#0f172a", padding: "14px 12px" }}>
      <div style={{ textAlign: "center", borderBottom: "2px solid #0ea5e9", paddingBottom: 10, flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: "#0ea5e9", letterSpacing: ".14em" }}>{form.kurumAdi || "KURUM BROŞÜRÜ"}</div>
        <h1 data-template-title style={{ margin: "8px 0 0", fontSize: 19, fontWeight: 900, lineHeight: 1.2 }}>{baslik}</h1>
      </div>

      <TemplateBody style={{ paddingTop: 12, minHeight: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, flexShrink: 0 }}>
          {panels.map((p, i) => (
            <div
              key={i}
              style={{
                background: i === 1 ? "#f0f9ff" : "#f8fafc",
                border: `1px solid ${i === 1 ? "#bae6fd" : "#e2e8f0"}`,
                borderRadius: i === 0 ? "12px 4px 4px 12px" : i === 2 ? "4px 12px 12px 4px" : 8,
                padding: "10px 8px",
                minHeight: 120,
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 900, color: "#0284c7", marginBottom: 6 }}>{p.baslik}</div>
              <div style={{ fontSize: 10, lineHeight: 1.45, color: "#475569", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical" }}>{p.metin}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: photo ? "1fr 88px" : "1fr", gap: 10, flex: 1, minHeight: 0, alignItems: "stretch" }}>
          <div style={{ background: "#f0f9ff", borderRadius: 12, padding: 12, border: "1px dashed #7dd3fc" }}>
            <DescBlock text={clampMetin(form.ekNot || form.kapanisCumlesi || "WhatsApp ile paylaşıma hazır kısa bilgilendirme.", 160)} fontSize={11} maxLines={4} color="#0369a1" />
          </div>
          {photo ? (
            <div style={{ borderRadius: 10, overflow: "hidden" }}>
              <PosterImg src={photo} height={88} radius={0} />
            </div>
          ) : (
            <EmptyPhotoSlot height={88} accent="#0ea5e9" />
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#0f172a", borderRadius: 12, padding: "10px 12px", flexShrink: 0 }}>
          <div style={{ width: 52, height: 52, background: "#fff", borderRadius: 8, display: "grid", placeItems: "center", fontSize: 8, fontWeight: 800, color: "#0f172a", textAlign: "center", lineHeight: 1.2 }}>
            İLETİŞİM
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{form.isim || "Sorumlu"}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{tarih} · Detay için kurumunuzla iletişime geçin</div>
          </div>
        </div>
      </TemplateBody>

      <TemplateFooter form={form} tarih={tarih} accent="#0ea5e9" />
    </TemplateShell>
  );
}
