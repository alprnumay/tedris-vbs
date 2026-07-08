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

/** Tek güçlü afiş — hero görsel + yarı saydam başlık bandı */
export default function SablonTekGucluAfis({ form, tarih }: TemplateProps) {
  const baslik = posterBaslik(form);
  const photo = form.gorseller[0];

  return (
    <TemplateShell style={{ background: "#020617", color: "#fff", padding: 0 }}>
      <div style={{ position: "relative", flex: "0 0 52%", minHeight: 280, maxHeight: 380, overflow: "hidden" }}>
        {photo ? (
          <PosterImg src={photo} height="100%" radius={0} style={{ minHeight: 280 }} />
        ) : (
          <EmptyPhotoSlot label="Hero görsel" height={280} accent="#f472b6" />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(2,6,23,.15) 0%, rgba(2,6,23,.75) 55%, rgba(2,6,23,.95) 100%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "18px 20px 16px", background: "linear-gradient(0deg, rgba(219,39,119,.55), transparent)" }}>
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: ".16em", color: "#fbcfe8", marginBottom: 6 }}>{form.kurumAdi || "VELİ BİLGİLENDİRME"}</div>
          <h1 data-template-title style={{ margin: 0, fontSize: 28, fontWeight: 950, lineHeight: 1.08, textShadow: "0 2px 12px rgba(0,0,0,.45)" }}>
            {baslik}
          </h1>
        </div>
      </div>

      <TemplateBody style={{ padding: "14px 20px 0", minHeight: 0 }}>
        <DescBlock text={clampMetin(form.posterMetni, 380)} fontSize={13} maxLines={6} color="rgba(255,255,255,.85)" />
        {form.ekNot && (
          <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 10, background: "rgba(244,114,182,.15)", border: "1px solid rgba(244,114,182,.35)", fontSize: 11, color: "#fbcfe8" }}>
            {clampMetin(form.ekNot, 140)}
          </div>
        )}
      </TemplateBody>

      <div style={{ padding: "12px 20px 16px", flexShrink: 0 }}>
        <TemplateFooter form={form} tarih={tarih} dark accent="#f472b6" />
      </div>
    </TemplateShell>
  );
}
