import { FormData, SablonTuru } from "../../types";
import { baslikolustur } from "../../lib/dil";

interface Tema {
  baslik: string;
  headerGradient: string;
  headerTextColor: string;
  headerSubColor: string;
  headerBadgeBg: string;
  bodyBg: string;
  accentColor: string;
  accentLight: string;
  textColor: string;
  subTextColor: string;
  footerBg: string;
  borderColor: string;
  labelColor: string;
  layout: "klasik" | "sidebar" | "karti";
}

const TEMALAR: Record<string, Tema> = {
  lacivert: {
    baslik: "Resmi Lacivert",
    headerGradient: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
    headerTextColor: "#fbbf24",
    headerSubColor: "rgba(251,191,36,0.75)",
    headerBadgeBg: "rgba(251,191,36,0.2)",
    bodyBg: "#f8fafc",
    accentColor: "#1e3a5f",
    accentLight: "#e2e8f0",
    textColor: "#0f172a",
    subTextColor: "#334155",
    footerBg: "#f1f5f9",
    borderColor: "#1e3a5f",
    labelColor: "#64748b",
    layout: "klasik",
  },
  mor: {
    baslik: "Rehberlik Mor",
    headerGradient: "linear-gradient(180deg, #4c1d95 0%, #7c3aed 100%)",
    headerTextColor: "#ffffff",
    headerSubColor: "rgba(255,255,255,0.75)",
    headerBadgeBg: "rgba(255,255,255,0.2)",
    bodyBg: "#f5f3ff",
    accentColor: "#7c3aed",
    accentLight: "#ede9fe",
    textColor: "#2e1065",
    subTextColor: "#4c1d95",
    footerBg: "#f5f3ff",
    borderColor: "#c4b5fd",
    labelColor: "#6d28d9",
    layout: "sidebar",
  },
  kirmizi: {
    baslik: "Enerji Kırmızı",
    headerGradient: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)",
    headerTextColor: "#ffffff",
    headerSubColor: "rgba(255,255,255,0.75)",
    headerBadgeBg: "rgba(255,255,255,0.2)",
    bodyBg: "#fff7f7",
    accentColor: "#dc2626",
    accentLight: "#fee2e2",
    textColor: "#7f1d1d",
    subTextColor: "#991b1b",
    footerBg: "#fff5f5",
    borderColor: "#fca5a5",
    labelColor: "#b91c1c",
    layout: "klasik",
  },
  turuncu: {
    baslik: "Bahar Turuncu",
    headerGradient: "linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)",
    headerTextColor: "#ffffff",
    headerSubColor: "rgba(255,255,255,0.75)",
    headerBadgeBg: "rgba(255,255,255,0.2)",
    bodyBg: "#fff7ed",
    accentColor: "#ea580c",
    accentLight: "#ffedd5",
    textColor: "#7c2d12",
    subTextColor: "#9a3412",
    footerBg: "#fff7ed",
    borderColor: "#fdba74",
    labelColor: "#c2410c",
    layout: "karti",
  },
  pembe: {
    baslik: "Anaokulu Pembe",
    headerGradient: "linear-gradient(180deg, #831843 0%, #db2777 100%)",
    headerTextColor: "#ffffff",
    headerSubColor: "rgba(255,255,255,0.75)",
    headerBadgeBg: "rgba(255,255,255,0.2)",
    bodyBg: "#fff0f6",
    accentColor: "#db2777",
    accentLight: "#fce7f3",
    textColor: "#831843",
    subTextColor: "#9d174d",
    footerBg: "#fff0f6",
    borderColor: "#f9a8d4",
    labelColor: "#be185d",
    layout: "sidebar",
  },
  teal: {
    baslik: "Doğa Teal",
    headerGradient: "linear-gradient(135deg, #134e4a 0%, #0d9488 100%)",
    headerTextColor: "#ffffff",
    headerSubColor: "rgba(255,255,255,0.75)",
    headerBadgeBg: "rgba(255,255,255,0.2)",
    bodyBg: "#f0fdfa",
    accentColor: "#0d9488",
    accentLight: "#ccfbf1",
    textColor: "#134e4a",
    subTextColor: "#115e59",
    footerBg: "#f0fdfa",
    borderColor: "#5eead4",
    labelColor: "#0f766e",
    layout: "karti",
  },
  altin: {
    baslik: "Altın Sarı",
    headerGradient: "linear-gradient(135deg, #713f12 0%, #ca8a04 100%)",
    headerTextColor: "#ffffff",
    headerSubColor: "rgba(255,255,255,0.75)",
    headerBadgeBg: "rgba(255,255,255,0.2)",
    bodyBg: "#fffbeb",
    accentColor: "#ca8a04",
    accentLight: "#fef9c3",
    textColor: "#713f12",
    subTextColor: "#92400e",
    footerBg: "#fffbeb",
    borderColor: "#fde68a",
    labelColor: "#a16207",
    layout: "klasik",
  },
};

function GorselGrid({ gorseller, borderColor }: { gorseller: string[]; borderColor: string }) {
  if (gorseller.length === 0) return null;
  if (gorseller.length === 1) {
    return (
      <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${borderColor}` }}>
        <img src={gorseller[0]} alt="Görsel" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
      </div>
    );
  }
  if (gorseller.length === 2) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {gorseller.map((g, i) => (
          <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${borderColor}` }}>
            <img src={g} alt={`Görsel ${i + 1}`} style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
          </div>
        ))}
      </div>
    );
  }
  if (gorseller.length === 3) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 8 }}>
        <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${borderColor}` }}>
          <img src={gorseller[0]} alt="Görsel 1" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {gorseller.slice(1).map((g, i) => (
            <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${borderColor}`, flex: 1 }}>
              <img src={g} alt={`Görsel ${i + 2}`} style={{ width: "100%", height: 84, objectFit: "cover", display: "block" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {gorseller.slice(0, 4).map((g, i) => (
        <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${borderColor}` }}>
          <img src={g} alt={`Görsel ${i + 1}`} style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
        </div>
      ))}
    </div>
  );
}

interface Props {
  form: FormData;
  tarih: string;
  sablonId: SablonTuru;
}

/* ─── Layout: Klasik (gradient header at top) ─── */
function LayoutKlasik({ t, form, tarih, baslik, aciklama, aktifFaaliyetler }: {
  t: Tema; form: FormData; tarih: string; baslik: string; aciklama: string; aktifFaaliyetler: FormData["faaliyetler"];
}) {
  return (
    <div style={{ width: "100%", borderRadius: 16, overflow: "hidden", background: t.bodyBg, border: `2px solid ${t.borderColor}`, fontFamily: "'Inter', Arial, sans-serif" }}>
      <div style={{ background: t.headerGradient, padding: "18px 22px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "3px 10px", borderRadius: 20, background: t.headerBadgeBg, color: t.headerTextColor }}>
            Veli Bilgilendirme
          </div>
          <div style={{ fontSize: 11, color: t.headerSubColor, whiteSpace: "nowrap", marginLeft: 8 }}>{tarih}</div>
        </div>
        <h1 style={{ fontSize: 19, fontWeight: 800, color: t.headerTextColor, margin: "0 0 4px", lineHeight: 1.3 }}>{baslik}</h1>
        {form.kurumAdi && <div style={{ fontSize: 13, fontWeight: 600, color: t.headerSubColor }}>{form.kurumAdi}</div>}
      </div>
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {form.gorseller.length > 0 && <GorselGrid gorseller={form.gorseller} borderColor={t.borderColor} />}
        {aktifFaaliyetler.length > 0 && (
          <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${t.borderColor}` }}>
            {aktifFaaliyetler.map((f, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "40% 60%", background: i % 2 === 0 ? t.accentLight : t.bodyBg, borderBottom: i < aktifFaaliyetler.length - 1 ? "1px solid " + t.borderColor : "none" }}>
                <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: t.labelColor }}>{aktifFaaliyetler.length > 1 ? `${i + 1}. Alan` : "Alan"}</div>
                <div style={{ padding: "8px 12px", fontSize: 11, color: t.textColor }}>{[f.tur, f.alan].filter(Boolean).join(" — ")}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ borderRadius: 10, padding: 14, background: t.accentLight, borderLeft: `4px solid ${t.accentColor}` }}>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: t.textColor, margin: 0 }}>{aciklama}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${t.borderColor}` }}>
          <div>
            {form.isim && <p style={{ fontSize: 14, fontWeight: 700, color: t.textColor, margin: 0 }}>{form.isim}</p>}
            <p style={{ fontSize: 11, color: t.subTextColor, margin: "2px 0 0" }}>{form.rol || "Öğretmen / Yurt Hocası"}</p>
          </div>
          <div style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 600, background: t.accentColor, color: "#ffffff" }}>Veliye Özel</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Layout: Sidebar (left colored column) ─── */
function LayoutSidebar({ t, form, tarih, baslik, aciklama, aktifFaaliyetler }: {
  t: Tema; form: FormData; tarih: string; baslik: string; aciklama: string; aktifFaaliyetler: FormData["faaliyetler"];
}) {
  return (
    <div style={{ width: "100%", borderRadius: 16, overflow: "hidden", display: "flex", border: `2px solid ${t.borderColor}`, fontFamily: "'Inter', Arial, sans-serif" }}>
      {/* Left sidebar */}
      <div style={{ width: 60, background: t.headerGradient, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "16px 0", flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: t.headerBadgeBg, border: `2px solid ${t.headerSubColor}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={16} height={16} fill="none" stroke={t.headerTextColor} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: t.headerTextColor, textTransform: "uppercase", opacity: 0.7 }}>
          Veli Bilgilendirme
        </div>
        <div style={{ fontSize: 9, color: t.headerSubColor, transform: "rotate(180deg)", writingMode: "vertical-rl", letterSpacing: "0.04em" }}>{tarih}</div>
      </div>
      {/* Right content */}
      <div style={{ flex: 1, background: t.bodyBg, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ borderBottom: `2px solid ${t.borderColor}`, paddingBottom: 10 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: t.textColor, margin: "0 0 4px", lineHeight: 1.3 }}>{baslik}</h1>
          {form.kurumAdi && <p style={{ fontSize: 12, color: t.subTextColor, margin: 0, fontWeight: 600 }}>{form.kurumAdi}</p>}
        </div>
        {form.gorseller.length > 0 && <GorselGrid gorseller={form.gorseller} borderColor={t.borderColor} />}
        {aktifFaaliyetler.length > 0 && (
          <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${t.borderColor}` }}>
            {aktifFaaliyetler.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: i % 2 === 0 ? t.accentLight : t.bodyBg, borderBottom: i < aktifFaaliyetler.length - 1 ? "1px solid " + t.borderColor : "none" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.accentColor, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: t.textColor, fontWeight: 600 }}>{[f.tur, f.alan].filter(Boolean).join(" — ")}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ borderRadius: 8, padding: 12, background: t.accentLight, borderLeft: `3px solid ${t.accentColor}` }}>
          <p style={{ fontSize: 13, lineHeight: 1.75, color: t.textColor, margin: 0 }}>{aciklama}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${t.borderColor}` }}>
          <div>
            {form.isim && <p style={{ fontSize: 13, fontWeight: 700, color: t.textColor, margin: 0 }}>{form.isim}</p>}
            <p style={{ fontSize: 10, color: t.subTextColor, margin: "2px 0 0" }}>{form.rol || "Öğretmen / Yurt Hocası"}</p>
          </div>
          <div style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 700, background: t.accentColor, color: "#fff" }}>Veliye Özel</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Layout: Karti (card style with thin top stripe) ─── */
function LayoutKarti({ t, form, tarih, baslik, aciklama, aktifFaaliyetler }: {
  t: Tema; form: FormData; tarih: string; baslik: string; aciklama: string; aktifFaaliyetler: FormData["faaliyetler"];
}) {
  return (
    <div style={{ width: "100%", borderRadius: 16, overflow: "hidden", background: "#ffffff", border: `1.5px solid ${t.borderColor}`, fontFamily: "'Inter', Arial, sans-serif" }}>
      {/* Top stripe */}
      <div style={{ height: 6, background: t.headerGradient }} />
      {/* Title area */}
      <div style={{ padding: "16px 20px 12px", background: "#fff", borderBottom: `1px solid ${t.borderColor}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.accentColor }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: t.accentColor }}>Veli Bilgilendirme</span>
          </div>
          <span style={{ fontSize: 10, color: t.subTextColor }}>{tarih}</span>
        </div>
        <h1 style={{ fontSize: 19, fontWeight: 800, color: t.textColor, margin: "0 0 4px", lineHeight: 1.3 }}>{baslik}</h1>
        {form.kurumAdi && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 4, padding: "3px 10px", borderRadius: 20, background: t.accentLight, border: `1px solid ${t.borderColor}` }}>
            <span style={{ fontSize: 11, color: t.accentColor, fontWeight: 600 }}>{form.kurumAdi}</span>
          </div>
        )}
      </div>
      {/* Body */}
      <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 14, background: t.bodyBg }}>
        {form.gorseller.length > 0 && <GorselGrid gorseller={form.gorseller} borderColor={t.borderColor} />}
        {aktifFaaliyetler.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {aktifFaaliyetler.map((f, i) => (
              <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: "#fff", border: `1.5px solid ${t.borderColor}` }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.accentColor }} />
                <span style={{ fontSize: 11, color: t.textColor, fontWeight: 600 }}>{[f.tur, f.alan].filter(Boolean).join(" — ")}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ borderRadius: 10, padding: 14, background: "#fff", border: `1px solid ${t.borderColor}`, borderLeft: `4px solid ${t.accentColor}` }}>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: t.textColor, margin: 0 }}>{aciklama}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `2px solid ${t.accentColor}` }}>
          <div>
            {form.isim && <p style={{ fontSize: 14, fontWeight: 700, color: t.textColor, margin: 0 }}>{form.isim}</p>}
            <p style={{ fontSize: 11, color: t.subTextColor, margin: "2px 0 0" }}>{form.rol || "Öğretmen / Yurt Hocası"}</p>
          </div>
          <div style={{ fontSize: 10, padding: "4px 10px", borderRadius: 20, fontWeight: 700, background: t.accentColor, color: "#fff" }}>Veliye Özel</div>
        </div>
      </div>
    </div>
  );
}

export default function SablonTemali({ form, tarih, sablonId }: Props) {
  const t = TEMALAR[sablonId] ?? TEMALAR.lacivert;
  const baslik = baslikolustur(form);
  const aciklama = form.posterMetni;
  const aktifFaaliyetler = form.faaliyetler.slice(0, form.faaliyetSayisi).filter((f) => f.tur || f.alan);

  if (t.layout === "sidebar") return <LayoutSidebar t={t} form={form} tarih={tarih} baslik={baslik} aciklama={aciklama} aktifFaaliyetler={aktifFaaliyetler} />;
  if (t.layout === "karti") return <LayoutKarti t={t} form={form} tarih={tarih} baslik={baslik} aciklama={aciklama} aktifFaaliyetler={aktifFaaliyetler} />;
  return <LayoutKlasik t={t} form={form} tarih={tarih} baslik={baslik} aciklama={aciklama} aktifFaaliyetler={aktifFaaliyetler} />;
}
