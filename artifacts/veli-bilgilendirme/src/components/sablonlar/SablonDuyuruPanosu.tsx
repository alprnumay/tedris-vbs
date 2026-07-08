import {
  activeFaaliyetler,
  clampMetin,
  PosterImg,
  posterBaslik,
  TemplateBody,
  TemplateFooter,
  TemplateProps,
  TemplateShell,
} from "../../lib/sablonlar/templateShared";

const NOTE_STYLES = [
  { bg: "#fef9c3", rot: -3, top: 8, left: 6, w: 148 },
  { bg: "#dbeafe", rot: 4, top: 72, left: 168, w: 132 },
  { bg: "#fce7f3", rot: -2, top: 168, left: 24, w: 140 },
  { bg: "#dcfce7", rot: 3, top: 248, left: 190, w: 120 },
  { bg: "#ffedd5", rot: -4, top: 320, left: 52, w: 156 },
];

/** Duyuru panosu — panoya asılı not/kart parçaları */
export default function SablonDuyuruPanosu({ form, tarih }: TemplateProps) {
  const baslik = posterBaslik(form);
  const items = activeFaaliyetler(form);
  const photos = form.gorseller.slice(0, 2);

  const notlar = [
    { tip: "Başlık", metin: baslik },
    ...items.slice(0, 2).map((f) => ({ tip: f.tur || "Faaliyet", metin: [f.alan, f.ozelNot].filter(Boolean).join(" · ") })),
    { tip: "Hatırlatma", metin: clampMetin(form.posterMetni, 120) },
    { tip: "Not", metin: form.ekNot || form.kapanisCumlesi || `${form.kurumAdi} · ${tarih}` },
  ];

  return (
    <TemplateShell style={{ background: "linear-gradient(145deg,#78716c,#57534e)", padding: 14 }}>
      <div style={{ fontSize: 9, fontWeight: 900, color: "#fafaf9", letterSpacing: ".12em", marginBottom: 8, opacity: 0.85 }}>DUYURU PANOSU</div>

      <TemplateBody style={{ position: "relative", minHeight: 420, background: "repeating-linear-gradient(45deg,#a8a29e 0,#a8a29e 2px,#78716c 2px,#78716c 8px)", borderRadius: 12, border: "6px solid #44403c", overflow: "hidden" }}>
        {notlar.slice(0, 5).map((n, i) => {
          const s = NOTE_STYLES[i];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: s.top,
                left: s.left,
                width: s.w,
                transform: `rotate(${s.rot}deg)`,
                background: s.bg,
                padding: "10px 10px 12px",
                borderRadius: 2,
                boxShadow: "2px 4px 10px rgba(0,0,0,.25)",
                border: "1px solid rgba(0,0,0,.08)",
              }}
            >
              <div style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", color: "#57534e", marginBottom: 4 }}>{n.tip}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1c1917", lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" }}>
                {n.metin}
              </div>
            </div>
          );
        })}

        {photos.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: i === 0 ? 130 : 290,
              left: i === 0 ? 200 : 8,
              width: 88,
              transform: `rotate(${i === 0 ? 5 : -6}deg)`,
              padding: 4,
              background: "#fff",
              boxShadow: "2px 4px 12px rgba(0,0,0,.3)",
            }}
          >
            <PosterImg src={p} height={64} radius={0} />
          </div>
        ))}
      </TemplateBody>

      <div style={{ marginTop: 10 }}>
        <TemplateFooter form={form} tarih={tarih} dark accent="#fde68a" />
      </div>
    </TemplateShell>
  );
}
