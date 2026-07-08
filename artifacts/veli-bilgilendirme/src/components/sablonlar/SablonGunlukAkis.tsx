import {
  activeFaaliyetler,
  clampMetin,
  DescBlock,
  PosterImg,
  posterBaslik,
  TemplateBody,
  TemplateFooter,
  TemplateProps,
  TemplateShell,
  TitleBlock,
} from "../../lib/sablonlar/templateShared";

const TIMELINE_COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#db2777"];

/** Günlük akış — dikey zaman çizelgesi */
export default function SablonGunlukAkis({ form, tarih }: TemplateProps) {
  const baslik = posterBaslik(form);
  const items = activeFaaliyetler(form);
  const photos = form.gorseller.slice(0, 2);
  const steps =
    items.length > 0
      ? items.map((f, i) => ({
          baslik: f.tur || ["Ders", "Etkinlik", "İkram", "Ödev", "Not"][i] || `Adım ${i + 1}`,
          aciklama: [f.alan, f.ozelNot].filter(Boolean).join(" · ") || "Kısa açıklama",
        }))
      : [
          { baslik: "Ders", aciklama: "Günün ana çalışması" },
          { baslik: "Etkinlik", aciklama: "Sosyal / uygulamalı bölüm" },
          { baslik: "Not", aciklama: clampMetin(form.posterMetni, 120) },
        ];

  return (
    <TemplateShell style={{ background: "linear-gradient(180deg,#eef2ff,#fff)", padding: 18 }}>
      <TitleBlock form={form} baslik={baslik} accent="#4338ca" size={21} />

      <TemplateBody style={{ position: "relative", paddingLeft: 22, minHeight: 0 }}>
        <div style={{ position: "absolute", left: 8, top: 4, bottom: 4, width: 3, background: "linear-gradient(180deg,#4338ca,#a5b4fc)", borderRadius: 99 }} />

        {steps.slice(0, 5).map((step, i) => (
          <div key={i} style={{ position: "relative", marginBottom: i === steps.length - 1 ? 0 : 12, paddingLeft: 8 }}>
            <div
              style={{
                position: "absolute",
                left: -20,
                top: 10,
                width: 14,
                height: 14,
                borderRadius: 999,
                background: TIMELINE_COLORS[i % TIMELINE_COLORS.length],
                border: "3px solid #fff",
                boxShadow: "0 0 0 1px #c7d2fe",
              }}
            />
            <div style={{ background: "#fff", borderRadius: 14, padding: "10px 12px", boxShadow: "0 4px 14px rgba(67,56,202,.08)" }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: TIMELINE_COLORS[i % TIMELINE_COLORS.length], textTransform: "uppercase" }}>{step.baslik}</div>
              <div style={{ fontSize: 11.5, color: "#334155", marginTop: 4, lineHeight: 1.45 }}>{step.aciklama}</div>
            </div>
          </div>
        ))}

        {photos[0] && (
          <div style={{ marginTop: 10, borderRadius: 14, overflow: "hidden", border: "2px solid #c7d2fe" }}>
            <PosterImg src={photos[0]} height={100} radius={0} />
            <div style={{ fontSize: 9, fontWeight: 800, padding: "6px 10px", background: "#4338ca", color: "#fff" }}>Günün görseli</div>
          </div>
        )}
        {!photos[0] && items.length === 0 && (
          <div style={{ marginTop: 8 }}>
            <DescBlock text={clampMetin(form.posterMetni, 280)} fontSize={11.5} maxLines={4} />
          </div>
        )}
      </TemplateBody>

      <TemplateFooter form={form} tarih={tarih} accent="#4338ca" />
    </TemplateShell>
  );
}
