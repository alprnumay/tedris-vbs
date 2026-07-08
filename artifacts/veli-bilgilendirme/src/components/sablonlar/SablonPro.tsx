import type { CSSProperties } from "react";
import { FormData, SablonTuru } from "../../types";
import { baslikolustur } from "../../lib/dil";
import { POSTER_SHELL_CLS, posterShellStyle } from "../../lib/sablonlar/posterShell";
import { calculateDescriptionClamp, calculateSubtitleSize, calculateTitleSize, templatePhotoStyle } from "../../lib/sablonlar/templateLayoutEngine";
import { PosterTemplateHeader } from "../veli/PosterTemplateHeader";

type Variant =
  | "card"
  | "minimal"
  | "hero"
  | "split"
  | "board"
  | "bento"
  | "line"
  | "note"
  | "badge"
  | "magazine"
  | "album"
  | "info"
  | "timeline"
  | "frame"
  | "grid"
  | "announce"
  | "collage"
  | "navy"
  | "paper"
  | "signature";

const CONFIG: Record<string, { variant: Variant; accent: string; bg: string; ink: string; soft: string; label: string }> = {
  "kurumsal-kart": { variant: "card", accent: "#2563eb", bg: "#f8fafc", ink: "#0f172a", soft: "#dbeafe", label: "Kurumsal Kart" },
  "pro-minimal": { variant: "minimal", accent: "#64748b", bg: "#ffffff", ink: "#111827", soft: "#f1f5f9", label: "Premium Minimal" },
  "hero-gorselli": { variant: "hero", accent: "#0ea5e9", bg: "#0f172a", ink: "#ffffff", soft: "#e0f2fe", label: "Hero Görselli" },
  "split-layout": { variant: "split", accent: "#4f46e5", bg: "#eef2ff", ink: "#1e1b4b", soft: "#ffffff", label: "Split Layout" },
  "egitim-panosu": { variant: "board", accent: "#1d4ed8", bg: "#eff6ff", ink: "#172554", soft: "#ffffff", label: "Eğitim Panosu" },
  "bento-kart": { variant: "bento", accent: "#7c3aed", bg: "#f5f3ff", ink: "#2e1065", soft: "#ffffff", label: "Bento Kart" },
  "akademik-cizgi": { variant: "line", accent: "#0f172a", bg: "#ffffff", ink: "#0f172a", soft: "#f8fafc", label: "Akademik Çizgi" },
  "veli-notu": { variant: "note", accent: "#92400e", bg: "#fffbeb", ink: "#451a03", soft: "#ffffff", label: "Veli Notu" },
  "etkinlik-rozetli": { variant: "badge", accent: "#15803d", bg: "#f0fdf4", ink: "#052e16", soft: "#ffffff", label: "Etkinlik Rozetli" },
  "dergi-stili": { variant: "magazine", accent: "#be123c", bg: "#fff1f2", ink: "#4c0519", soft: "#ffffff", label: "Dergi Stili" },
  "sicak-album": { variant: "album", accent: "#c2410c", bg: "#fff7ed", ink: "#431407", soft: "#ffedd5", label: "Sıcak Albüm" },
  "kartli-bilgi-pro": { variant: "info", accent: "#0d9488", bg: "#f0fdfa", ink: "#042f2e", soft: "#ffffff", label: "Kartlı Bilgi" },
  "zaman-akisi": { variant: "timeline", accent: "#4338ca", bg: "#eef2ff", ink: "#1e1b4b", soft: "#ffffff", label: "Zaman Akışı" },
  "cerceveli-klasik": { variant: "frame", accent: "#78350f", bg: "#fffaf0", ink: "#431407", soft: "#ffffff", label: "Çerçeveli Klasik" },
  "modern-grid": { variant: "grid", accent: "#0284c7", bg: "#f0f9ff", ink: "#082f49", soft: "#ffffff", label: "Modern Grid" },
  "poster-duyuru": { variant: "announce", accent: "#dc2626", bg: "#fef2f2", ink: "#450a0a", soft: "#ffffff", label: "Poster Duyuru" },
  "foto-kolaj-premium": { variant: "collage", accent: "#0891b2", bg: "#ecfeff", ink: "#083344", soft: "#ffffff", label: "Foto Kolaj" },
  "kurumsal-lacivert": { variant: "navy", accent: "#38bdf8", bg: "#0f172a", ink: "#f8fafc", soft: "#1e293b", label: "Kurumsal Lacivert" },
  "soft-paper": { variant: "paper", accent: "#a16207", bg: "#fefce8", ink: "#422006", soft: "#ffffff", label: "Soft Paper" },
  "imza-tasarim": { variant: "signature", accent: "#334155", bg: "#f8fafc", ink: "#0f172a", soft: "#ffffff", label: "İmza Tasarım" },
};

function textClamp(text: string, max = 520) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

function activeItems(form: FormData) {
  return form.faaliyetler.slice(0, form.faaliyetSayisi).filter((f) => f.tur || f.alan || f.ozelNot);
}

function Photo({ src, h = 130, radius = 18 }: { src: string; h?: number; radius?: number }) {
  return <img src={src} alt="Görsel" style={{ ...templatePhotoStyle({ height: h }), borderRadius: radius }} />;
}

function PhotoBlock({ photos, variant, accent }: { photos: string[]; variant: Variant; accent: string }) {
  if (photos.length === 0) {
    return (
      <div style={{ borderRadius: 20, minHeight: 96, background: `linear-gradient(135deg, ${accent}18, #ffffff66)`, border: `1px dashed ${accent}55`, display: "grid", placeItems: "center", color: accent, fontSize: 12, fontWeight: 800 }}>
        Görsel eklenirse burada dengeli yerleşir
      </div>
    );
  }
  if (variant === "hero" || variant === "announce") return <Photo src={photos[0]} h={200} radius={0} />;
  if (variant === "split") return <Photo src={photos[0]} h={240} radius={20} />;
  if (variant === "collage" || variant === "album") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: photos.length === 1 ? "1fr" : "1.4fr 1fr", gap: 8 }}>
        <Photo src={photos[0]} h={photos.length === 1 ? 210 : 220} radius={18} />
        {photos.length > 1 && (
          <div style={{ display: "grid", gap: 8 }}>
            {photos.slice(1, 4).map((p, i) => <Photo key={i} src={p} h={photos.length === 2 ? 220 : 68} radius={14} />)}
          </div>
        )}
      </div>
    );
  }
  if (photos.length === 1) return <Photo src={photos[0]} h={170} radius={18} />;
  if (photos.length === 2) return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{photos.map((p, i) => <Photo key={i} src={p} h={150} radius={16} />)}</div>;
  if (photos.length === 3) return <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 8 }}><Photo src={photos[0]} h={180} radius={16} /><div style={{ display: "grid", gap: 8 }}>{photos.slice(1).map((p, i) => <Photo key={i} src={p} h={86} radius={14} />)}</div></div>;
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{photos.slice(0, 4).map((p, i) => <Photo key={i} src={p} h={118} radius={14} />)}</div>;
}

function InfoCards({ form, accent, light = false }: { form: FormData; accent: string; light?: boolean }) {
  const items = activeItems(form);
  const color = light ? "rgba(255,255,255,.88)" : "#334155";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8 }}>
      {items.slice(0, 4).map((f, i) => (
        <div key={i} style={{ borderRadius: 14, padding: 12, background: light ? "rgba(255,255,255,.1)" : "#ffffff", border: `1px solid ${light ? "rgba(255,255,255,.16)" : "#e2e8f0"}` }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: accent, textTransform: "uppercase", letterSpacing: ".08em" }}>{f.tur || `Faaliyet ${i + 1}`}</div>
          <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800, color }}>{f.alan || "Çalışma"}</div>
          {f.ozelNot && <div style={{ marginTop: 4, fontSize: 10.5, color: light ? "rgba(255,255,255,.62)" : "#64748b" }}>{f.ozelNot}</div>}
        </div>
      ))}
    </div>
  );
}

export default function SablonPro({ form, tarih, sablonId }: { form: FormData; tarih: string; sablonId: SablonTuru }) {
  const cfg = CONFIG[sablonId] ?? CONFIG["kurumsal-kart"];
  const baslik = baslikolustur(form);
  const metin = textClamp(form.posterMetni || "Bilgilendirme metni burada yer alır.", cfg.variant === "minimal" ? 360 : 560);
  const photos = form.gorseller;
  const dark = ["hero", "navy"].includes(cfg.variant);
  const base: CSSProperties = { ...posterShellStyle, borderRadius: 18, background: cfg.bg, color: cfg.ink, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" };
  const shellCls = POSTER_SHELL_CLS;
  const titleStyle = (baseSize: number): CSSProperties => calculateTitleSize(baslik, { base: baseSize });
  const descriptionStyle = (fontSize: number, maxLines = 7): CSSProperties => calculateDescriptionClamp(metin, { fontSize, maxLines });
  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
      <span style={{ borderRadius: 999, padding: "5px 10px", background: dark ? "rgba(255,255,255,.13)" : `${cfg.accent}18`, color: dark ? "#fff" : cfg.accent, fontSize: 10, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>VELİ BİLGİLENDİRME</span>
      <span style={{ fontSize: 11, color: dark ? "rgba(255,255,255,.65)" : "#64748b", fontWeight: 700 }}>{tarih}</span>
    </div>
  );
  const footer = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: `1px solid ${dark ? "rgba(255,255,255,.12)" : "#e2e8f0"}`, paddingTop: 14 }}>
      <div><div style={{ fontSize: 14, fontWeight: 900 }}>{form.isim || "Sorumlu"}</div><div style={{ fontSize: 11, color: dark ? "rgba(255,255,255,.6)" : "#64748b" }}>{form.rol || "Kurum Sorumlusu"}</div></div>
      <div style={{ color: cfg.accent, fontSize: 11, fontWeight: 900 }}>{form.kurumAdi || "Nehari Veli Bilgilendirme"}</div>
    </div>
  );

  if (cfg.variant === "hero") {
    return (
      <div className={shellCls} style={{ ...base, background: "#0f172a", color: "#fff" }}>
        <div style={{ flex: "0 0 44%", minHeight: 260, maxHeight: 320, position: "relative", overflow: "hidden", flexShrink: 0 }}>
          {photos.length > 0 ? (
            <img src={photos[0]} alt="Kapak" style={templatePhotoStyle({ height: "100%" })} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${cfg.accent}33 0%, #0f172a 100%)`, display: "grid", placeItems: "center", color: "rgba(255,255,255,.55)", fontSize: 13, fontWeight: 700 }}>
              Hero görseli
            </div>
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(15,23,42,.08) 0%, rgba(15,23,42,.72) 100%)", pointerEvents: "none" }} />
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "16px 22px 0", overflow: "hidden" }}>
          {header}
          <h1 data-template-title style={{ ...titleStyle(24), margin: "12px 0 6px", fontWeight: 950 }}>{baslik}</h1>
          {form.kurumAdi && <div style={{ fontSize: 11, color: cfg.accent, fontWeight: 800, marginBottom: 8, flexShrink: 0 }}>{form.kurumAdi}</div>}
          <p data-template-description style={{ ...descriptionStyle(13, 6), margin: 0, flex: 1, minHeight: 0, color: "rgba(255,255,255,.82)" }}>{metin}</p>
          {activeItems(form).length > 0 && (
            <div style={{ marginTop: 12, flexShrink: 0 }}>
              <InfoCards form={form} accent={cfg.accent} light />
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0, padding: "12px 22px 18px", marginTop: "auto" }}>{footer}</div>
      </div>
    );
  }
  if (cfg.variant === "split") {
    return (
      <div className={shellCls} style={{ ...base, padding: 18, flexDirection: "row", gap: 16, alignItems: "stretch" }}>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", overflow: "hidden" }}>
          {photos.length > 0 ? (
            <div style={{ flex: 1, minHeight: 0, borderRadius: 18, overflow: "hidden" }}>
              <img src={photos[0]} alt="Görsel" style={templatePhotoStyle({ height: "100%" })} />
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0, borderRadius: 18, background: `linear-gradient(160deg, ${cfg.accent}22, ${cfg.bg})`, border: `1px dashed ${cfg.accent}55`, display: "grid", placeItems: "center", color: cfg.accent, fontSize: 12, fontWeight: 800, padding: 16, textAlign: "center" }}>
              Görsel alanı
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
          {header}
          <h1 data-template-title style={{ ...titleStyle(22), margin: 0, fontWeight: 950, flexShrink: 0 }}>{baslik}</h1>
          {form.kurumAdi && <div style={{ fontSize: 11, color: cfg.accent, fontWeight: 800, flexShrink: 0 }}>{form.kurumAdi}</div>}
          {activeItems(form).length > 0 && (
            <div style={{ flexShrink: 0 }}>
              <InfoCards form={form} accent={cfg.accent} />
            </div>
          )}
          <div style={{ flex: 1, minHeight: 0, borderRadius: 16, background: cfg.soft, padding: 14, overflow: "hidden" }}>
            <p data-template-description style={{ ...descriptionStyle(13, 6), margin: 0 }}>{metin}</p>
          </div>
          <div style={{ marginTop: "auto", flexShrink: 0 }}>{footer}</div>
        </div>
      </div>
    );
  }
  if (cfg.variant === "bento") return <div className={shellCls} style={{ ...base, padding: 22 }}><div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 12, flex: 1, minHeight: 0, overflow: "hidden", alignContent: "start" }}>{<div style={{ borderRadius: 22, background: "#fff", padding: 18 }}>{header}<h1 data-template-title style={{ ...titleStyle(25), margin: "18px 0 0", fontWeight: 950 }}>{baslik}</h1></div>}<div style={{ borderRadius: 22, background: cfg.accent, color: "#fff", padding: 18, fontWeight: 900 }}>{form.kurumAdi || "Kurum Bilgisi"}</div><div style={{ gridColumn: "span 2" }}><PhotoBlock photos={photos} variant="collage" accent={cfg.accent} /></div><div style={{ gridColumn: "span 2" }}><InfoCards form={form} accent={cfg.accent} /></div><div style={{ gridColumn: "span 2", borderRadius: 20, background: "#fff", padding: 16 }}><p data-template-description style={{ ...descriptionStyle(13.5, 5), margin: 0 }}>{metin}</p></div></div><div style={{ flexShrink: 0, marginTop: "auto" }}>{footer}</div></div>;
  if (cfg.variant === "timeline") return <div className={shellCls} style={{ ...base, padding: 24 }}><div style={{ borderLeft: `4px solid ${cfg.accent}`, paddingLeft: 18, flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>{header}<h1 data-template-title style={{ ...titleStyle(26), margin: "20px 0", fontWeight: 950 }}>{baslik}</h1>{activeItems(form).map((f, i) => <div key={i} style={{ position: "relative", marginBottom: 14, padding: "12px 14px", borderRadius: 16, background: "#fff" }}><span style={{ position: "absolute", left: -30, top: 14, width: 14, height: 14, borderRadius: 999, background: cfg.accent }} /><b>{f.tur || `Adım ${i + 1}`}</b><div style={{ fontSize: 12, color: "#64748b" }}>{[f.alan, f.ozelNot].filter(Boolean).join(" · ")}</div></div>)}<p data-template-description style={{ ...descriptionStyle(13.5, 6), flex: 1, minHeight: 0 }}>{metin}</p>{footer}</div></div>;
  if (cfg.variant === "navy") return <div className={shellCls} style={{ ...base, padding: 24, background: "linear-gradient(145deg,#020617,#172554)", color: "#fff" }}>{header}<h1 data-template-title style={{ ...titleStyle(28), margin: "22px 0 14px", fontWeight: 950 }}>{baslik}</h1><PhotoBlock photos={photos} variant="collage" accent={cfg.accent} /><div style={{ marginTop: 16 }}><InfoCards form={form} accent={cfg.accent} light /></div><p data-template-description style={{ ...descriptionStyle(13.5, 6), color: "rgba(255,255,255,.78)", flex: 1, minHeight: 0 }}>{metin}</p><div style={{ marginTop: "auto", flexShrink: 0 }}>{footer}</div></div>;
  if (cfg.variant === "magazine") {
    return (
      <div className={shellCls} style={{ ...base, padding: "20px 22px 18px" }}>
        <div style={{ flexShrink: 0, borderBottom: `3px solid ${cfg.accent}`, paddingBottom: 14 }}>
          {header}
          <h1 data-template-title style={{ ...titleStyle(28), margin: "16px 0 8px", fontWeight: 950, letterSpacing: "-.03em" }}>{baslik}</h1>
          {form.kurumAdi && (
            <div style={{ color: cfg.accent, fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".06em" }}>{form.kurumAdi}</div>
          )}
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 12, paddingTop: 14, overflow: "hidden" }}>
          {photos.length > 0 && (
            <div style={{ flexShrink: 0, borderRadius: 12, overflow: "hidden", height: 170 }}>
              <img src={photos[0]} alt="Görsel" style={templatePhotoStyle({ height: "100%" })} />
            </div>
          )}
          {activeItems(form).length > 0 && (
            <div style={{ flexShrink: 0 }}>
              <InfoCards form={form} accent={cfg.accent} />
            </div>
          )}
          <div style={{ flex: 1, minHeight: 0, borderRadius: 16, background: cfg.soft, padding: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: cfg.accent, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8, flexShrink: 0 }}>Faaliyet Özeti</div>
            <p data-template-description style={{ ...descriptionStyle(13.5, 6), margin: 0, flex: 1 }}>{metin}</p>
          </div>
        </div>
        <div style={{ marginTop: "auto", flexShrink: 0, paddingTop: 12 }}>{footer}</div>
      </div>
    );
  }

  const boxed = cfg.variant === "frame" ? { border: `6px double ${cfg.accent}`, background: cfg.bg } : {};
  return (
    <div className={shellCls} style={{ ...base, ...boxed, padding: 22 }}>
      <PosterTemplateHeader style={{ padding: 0, marginBottom: 4 }}>
        {header}
        <h1
          data-template-title
          style={{
            ...titleStyle(cfg.variant === "announce" ? 34 : 25),
            margin: "14px 0 8px",
            fontWeight: 800,
            letterSpacing: "-.035em",
          }}
        >
          {baslik}
        </h1>
        {form.kurumAdi && (
          <div
            data-template-subtitle
            style={{
              ...calculateSubtitleSize(form.kurumAdi, { base: 12 }),
              color: cfg.accent,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            {form.kurumAdi}
          </div>
        )}
      </PosterTemplateHeader>
      <div style={{ display: "block", gridTemplateColumns: "1fr .9fr", gap: 18 }}>
        <div>
          {["minimal", "note", "paper", "signature"].includes(cfg.variant) && <p data-template-description style={{ ...descriptionStyle(15, 7), margin: "14px 0", background: cfg.soft, padding: 16, borderRadius: 18 }}>{metin}</p>}
        </div>
        {cfg.variant !== "minimal" && <PhotoBlock photos={photos} variant={cfg.variant} accent={cfg.accent} />}
      </div>
      {!["minimal", "note", "paper", "signature"].includes(cfg.variant) && <p data-template-description style={{ ...descriptionStyle(13.5, 6), margin: "16px 0", background: cfg.soft, padding: 15, borderRadius: 18 }}>{metin}</p>}
      {cfg.variant === "grid" ? <InfoCards form={form} accent={cfg.accent} /> : <div style={{ marginTop: 12 }}><InfoCards form={form} accent={cfg.accent} /></div>}
      <div style={{ marginTop: "auto", flexShrink: 0 }}>{footer}</div>
    </div>
  );
}

