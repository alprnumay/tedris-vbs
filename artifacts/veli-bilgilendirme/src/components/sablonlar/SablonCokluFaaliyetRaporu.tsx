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

const ROW_ICONS = ["📘", "🎯", "🍽", "✏️", "📋"];

/** Çoklu faaliyet raporu — 3+ faaliyet satırı (ad + açıklama + küçük görsel) */
export default function SablonCokluFaaliyetRaporu({ form, tarih }: TemplateProps) {
  const baslik = posterBaslik(form);
  const items = activeFaaliyetler(form);
  const photos = form.gorseller;

  const rows =
    items.length > 0
      ? items.slice(0, 5).map((f, i) => ({
          ad: f.tur || `Faaliyet ${i + 1}`,
          aciklama: [f.alan, f.ozelNot].filter(Boolean).join(" · ") || "Kısa açıklama",
          photo: photos[i],
        }))
      : [
          { ad: "Ders / Etüt", aciklama: clampMetin(form.posterMetni, 100), photo: photos[0] },
          { ad: "Etkinlik", aciklama: form.ekNot || "Günün sosyal bölümü", photo: photos[1] },
          { ad: "Veli Notu", aciklama: form.kapanisCumlesi || `${form.isim} — bilgilendirme`, photo: photos[2] },
        ];

  return (
    <TemplateShell style={{ background: "#faf5ff", color: "#3b0764", padding: 16 }}>
      <TitleBlock form={form} baslik={baslik} accent="#7e22ce" size={20} />
      <div style={{ fontSize: 10, fontWeight: 800, color: "#9333ea", marginBottom: 10 }}>ÇOKLU FAALİYET RAPORU</div>

      <TemplateBody style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: row.photo ? "52px 1fr 64px" : "52px 1fr",
              gap: 10,
              alignItems: "center",
              background: "#fff",
              borderRadius: 14,
              padding: "10px 12px",
              border: "1px solid #e9d5ff",
              flexShrink: 0,
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f3e8ff", display: "grid", placeItems: "center", fontSize: 20 }}>
              {ROW_ICONS[i % ROW_ICONS.length]}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#6b21a8" }}>{row.ad}</div>
              <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 3, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {row.aciklama}
              </div>
            </div>
            {row.photo ? (
              <div style={{ borderRadius: 10, overflow: "hidden" }}>
                <PosterImg src={row.photo} height={52} radius={0} />
              </div>
            ) : null}
          </div>
        ))}

        <div style={{ flex: 1, minHeight: 0, marginTop: 4, padding: "10px 12px", background: "#fff", borderRadius: 12, border: "1px dashed #d8b4fe" }}>
          <DescBlock text={clampMetin(form.posterMetni, 260)} fontSize={11} maxLines={4} color="#64748b" />
        </div>
      </TemplateBody>

      <TemplateFooter form={form} tarih={tarih} accent="#7e22ce" />
    </TemplateShell>
  );
}
