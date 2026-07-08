import {
  activeFaaliyetler,
  clampMetin,
  PosterImg,
  posterBaslik,
  TemplateBody,
  TemplateFooter,
  TemplateProps,
  TemplateShell,
  TitleBlock,
} from "../../lib/sablonlar/templateShared";

/** Sınıf rapor kartı — 4 sabit rapor kutusu */
export default function SablonSinifRaporKarti({ form, tarih }: TemplateProps) {
  const baslik = posterBaslik(form);
  const items = activeFaaliyetler(form);
  const photo = form.gorseller[0];

  const kartlar = [
    {
      baslik: "Bugün Yapılan",
      icerik: items[0] ? `${items[0].tur}${items[0].alan ? ` · ${items[0].alan}` : ""}` : clampMetin(form.posterMetni, 100),
    },
    {
      baslik: "Öğrenci Kazanımı",
      icerik: items[0]?.ozelNot || items[1]?.alan || clampMetin(form.posterMetni, 90),
    },
    {
      baslik: "Evde Tekrar",
      icerik: items[1] ? `${items[1].tur}${items[1].alan ? ` · ${items[1].alan}` : ""}` : form.ekNot || "Velilerin evde destekleyebileceği kısa tekrar.",
    },
    {
      baslik: "Hoca Notu",
      icerik: form.kapanisCumlesi || items[2]?.ozelNot || `${form.isim} — ${form.rol || "Sorumlu"}`,
    },
  ];

  return (
    <TemplateShell style={{ background: "#f0fdf4", color: "#14532d", padding: 16 }}>
      <TitleBlock form={form} baslik={baslik} accent="#15803d" size={20} />
      <div style={{ fontSize: 10, fontWeight: 800, color: "#166534", marginBottom: 10 }}>SINIF RAPOR ÖZETİ · {tarih}</div>

      <TemplateBody style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, minHeight: 0, alignContent: "start" }}>
        {kartlar.map((k, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "10px 11px",
              border: "1px solid #bbf7d0",
              boxShadow: "0 2px 8px rgba(21,128,61,.06)",
              minHeight: 0,
            }}
          >
            <div style={{ fontSize: 9, fontWeight: 900, color: "#15803d", textTransform: "uppercase", letterSpacing: ".06em" }}>{k.baslik}</div>
            <div style={{ fontSize: 11, lineHeight: 1.45, marginTop: 6, color: "#334155", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" }}>
              {k.icerik}
            </div>
          </div>
        ))}

        {photo && (
          <div style={{ gridColumn: "span 2", display: "flex", gap: 10, alignItems: "center", background: "#fff", borderRadius: 12, padding: 8, border: "1px solid #bbf7d0" }}>
            <div style={{ width: 72, flexShrink: 0, borderRadius: 10, overflow: "hidden" }}>
              <PosterImg src={photo} height={56} radius={0} />
            </div>
            <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.4 }}>Destekleyici sınıf görseli</div>
          </div>
        )}
      </TemplateBody>

      <TemplateFooter form={form} tarih={tarih} accent="#15803d" />
    </TemplateShell>
  );
}
