import type { CSSProperties } from "react";
import { FormData, SablonTuru } from "../../types";
import { baslikolustur } from "../../lib/dil";

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
  return <img src={src} alt="Görsel" style={{ width: "100%", height: h, objectFit: "cover", display: "block", borderRadius: radius }} />;
}

function PhotoBlock({ photos, variant, accent }: { photos: string[]; variant: Variant; accent: string }) {
  if (photos.length === 0) {
    return (
      <div style={{ borderRadius: 20, minHeight: 96, background: `linear-gradient(135deg, ${accent}18, #ffffff66)`, border: `1px dashed ${accent}55`, display: "grid", placeItems: "center", color: accent, fontSize: 12, fontWeight: 800 }}>
        Görsel eklenirse burada dengeli yerleşir
      </div>
    );
  }
  if (variant === "hero" || variant === "announce") return <Photo src={photos[0]} h={250} radius={0} />;
  if (variant === "split") return <Photo src={photos[0]} h={380} radius={20} />;
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
  const base: CSSProperties = { width: "100%", minHeight: 720, borderRadius: 18, overflow: "hidden", background: cfg.bg, color: cfg.ink, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", boxShadow: "0 16px 48px rgba(15,23,42,.12)" };
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

  if (cfg.variant === "hero") return <div style={{ ...base, background: "#0f172a", color: "#fff" }}><div style={{ position: "relative" }}><PhotoBlock photos={photos} variant="hero" accent={cfg.accent} /><div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(15,23,42,.18),rgba(15,23,42,.92))" }} /><div style={{ position: "absolute", inset: 0, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>{header}<div><h1 style={{ fontSize: 30, lineHeight: 1.1, margin: 0, fontWeight: 950 }}>{baslik}</h1><p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.55, maxWidth: 420 }}>{metin}</p></div></div></div><div style={{ padding: 20 }}><InfoCards form={form} accent={cfg.accent} light />{footer}</div></div>;
  if (cfg.variant === "split") return <div style={{ ...base, padding: 22, display: "grid", gridTemplateColumns: photos.length ? "1fr 1fr" : "1fr", gap: 18 }}><PhotoBlock photos={photos} variant="split" accent={cfg.accent} /><div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{header}<h1 style={{ fontSize: 26, lineHeight: 1.16, margin: 0, fontWeight: 950 }}>{baslik}</h1><InfoCards form={form} accent={cfg.accent} /><p style={{ fontSize: 13.5, lineHeight: 1.65, margin: 0 }}>{metin}</p>{footer}</div></div>;
  if (cfg.variant === "bento") return <div style={{ ...base, padding: 22 }}><div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 12 }}>{<div style={{ borderRadius: 22, background: "#fff", padding: 18 }}>{header}<h1 style={{ fontSize: 25, lineHeight: 1.16, margin: "18px 0 0", fontWeight: 950 }}>{baslik}</h1></div>}<div style={{ borderRadius: 22, background: cfg.accent, color: "#fff", padding: 18, fontWeight: 900 }}>{form.kurumAdi || "Kurum Bilgisi"}</div><div style={{ gridColumn: "span 2" }}><PhotoBlock photos={photos} variant="collage" accent={cfg.accent} /></div><div style={{ gridColumn: "span 2" }}><InfoCards form={form} accent={cfg.accent} /></div><div style={{ gridColumn: "span 2", borderRadius: 20, background: "#fff", padding: 16 }}><p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65 }}>{metin}</p></div></div></div>;
  if (cfg.variant === "timeline") return <div style={{ ...base, padding: 24 }}><div style={{ borderLeft: `4px solid ${cfg.accent}`, paddingLeft: 18 }}>{header}<h1 style={{ fontSize: 26, lineHeight: 1.18, margin: "20px 0", fontWeight: 950 }}>{baslik}</h1>{activeItems(form).map((f, i) => <div key={i} style={{ position: "relative", marginBottom: 14, padding: "12px 14px", borderRadius: 16, background: "#fff" }}><span style={{ position: "absolute", left: -30, top: 14, width: 14, height: 14, borderRadius: 999, background: cfg.accent }} /><b>{f.tur || `Adım ${i + 1}`}</b><div style={{ fontSize: 12, color: "#64748b" }}>{[f.alan, f.ozelNot].filter(Boolean).join(" · ")}</div></div>)}<p style={{ fontSize: 13.5, lineHeight: 1.7 }}>{metin}</p>{footer}</div></div>;
  if (cfg.variant === "navy") return <div style={{ ...base, padding: 24, background: "linear-gradient(145deg,#020617,#172554)", color: "#fff" }}>{header}<h1 style={{ fontSize: 28, lineHeight: 1.12, margin: "22px 0 14px", fontWeight: 950 }}>{baslik}</h1><PhotoBlock photos={photos} variant="collage" accent={cfg.accent} /><div style={{ marginTop: 16 }}><InfoCards form={form} accent={cfg.accent} light /></div><p style={{ fontSize: 13.5, lineHeight: 1.7, color: "rgba(255,255,255,.78)" }}>{metin}</p>{footer}</div>;

  const boxed = cfg.variant === "frame" ? { border: `6px double ${cfg.accent}`, background: cfg.bg } : {};
  return (
    <div style={{ ...base, ...boxed, padding: 22 }}>
      {header}
      <div style={{ display: cfg.variant === "magazine" ? "grid" : "block", gridTemplateColumns: "1fr .9fr", gap: 18 }}>
        <div>
          <h1 style={{ fontSize: cfg.variant === "announce" ? 34 : 25, lineHeight: 1.14, margin: "18px 0 10px", fontWeight: 950, letterSpacing: "-.035em" }}>{baslik}</h1>
          {form.kurumAdi && <div style={{ color: cfg.accent, fontSize: 12, fontWeight: 900, marginBottom: 12 }}>{form.kurumAdi}</div>}
          {["minimal", "note", "paper", "signature"].includes(cfg.variant) && <p style={{ fontSize: 15, lineHeight: 1.75, margin: "14px 0", background: cfg.soft, padding: 16, borderRadius: 18 }}>{metin}</p>}
        </div>
        {cfg.variant !== "minimal" && <PhotoBlock photos={photos} variant={cfg.variant} accent={cfg.accent} />}
      </div>
      {!["minimal", "note", "paper", "signature"].includes(cfg.variant) && <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: "16px 0", background: cfg.soft, padding: 15, borderRadius: 18 }}>{metin}</p>}
      {cfg.variant === "grid" ? <InfoCards form={form} accent={cfg.accent} /> : <div style={{ marginTop: 12 }}><InfoCards form={form} accent={cfg.accent} /></div>}
      <div style={{ marginTop: 18 }}>{footer}</div>
    </div>
  );
}

