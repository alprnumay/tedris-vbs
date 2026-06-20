import type { CSSProperties } from "react";
import { FormData } from "../../types";
import { baslikolustur } from "../../lib/dil";

interface Props { form: FormData; tarih: string; }

const shellFillStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  minHeight: "100%",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  margin: 0,
  background: "#0f172a",
  fontFamily: "'Inter', Arial, sans-serif",
};

const footerStyle: CSSProperties = {
  marginTop: "auto",
  minHeight: "auto",
  boxSizing: "border-box",
};

function HeroGorseller({ gorseller }: { gorseller: string[] }) {
  if (gorseller.length === 0) {
    return (
      <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📸</div>
          <div style={{ fontSize: 13, color: "#475569" }}>Fotoğraf ekleyin</div>
        </div>
      </div>
    );
  }

  if (gorseller.length === 1) {
    return (
      <img src={gorseller[0]} alt="Kapak" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    );
  }

  if (gorseller.length === 2) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: "100%", height: "100%", gap: 3 }}>
        {gorseller.map((g, i) => (
          <div key={i} style={{ overflow: "hidden", minHeight: 0, minWidth: 0 }}>
            <img src={g} alt={`Görsel ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        ))}
      </div>
    );
  }

  if (gorseller.length >= 4) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", width: "100%", height: "100%", gap: 3 }}>
        {gorseller.slice(0, 4).map((g, i) => (
          <div key={i} style={{ overflow: "hidden", minHeight: 0, minWidth: 0 }}>
            <img src={g} alt={`Görsel ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", width: "100%", height: "100%", gap: 3 }}>
      <div style={{ overflow: "hidden", minHeight: 0, minWidth: 0 }}>
        <img src={gorseller[0]} alt="Görsel 1" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 3, minHeight: 0 }}>
        {gorseller.slice(1, 3).map((g, i) => (
          <div key={i} style={{ overflow: "hidden", minHeight: 0, minWidth: 0 }}>
            <img src={g} alt={`Görsel ${i + 2}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SablonFotografOdakli({ form, tarih }: Props) {
  const baslik = baslikolustur(form);
  const aciklama = form.posterMetni;
  const aktif = form.faaliyetler.slice(0, form.faaliyetSayisi).filter((f) => f.tur || f.alan);
  const gorseller = form.gorseller;

  return (
    <div className="veli-poster-template-shell" style={shellFillStyle}>
      <div style={{ flex: "0 0 44%", flexShrink: 0, minHeight: 0, overflow: "hidden", position: "relative" }}>
        <HeroGorseller gorseller={gorseller} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0.5) 100%)", pointerEvents: "none" }} />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "0 20px", overflow: "hidden" }}>
        <div style={{ padding: "14px 0 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#0ea5e9", flexShrink: 0 }}>
            Veli Bilgilendirme
          </span>
          <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0, whiteSpace: "nowrap" }}>{tarih}</span>
        </div>

        <h1 style={{ fontSize: 21, fontWeight: 800, color: "#f8fafc", margin: "12px 0 6px", lineHeight: 1.25, flexShrink: 0, overflow: "hidden" }}>
          {baslik}
        </h1>

        {aktif.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10, flexShrink: 0 }}>
            {aktif.map((f, i) => (
              <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,0.1)", color: "#94a3b8", fontWeight: 600, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.alan || f.tur}
              </span>
            ))}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", paddingBottom: 8 }}>
          {form.kurumAdi && (
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0ea5e9", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {form.kurumAdi}
            </div>
          )}
          <p style={{ fontSize: 13, lineHeight: 1.75, color: "#cbd5e1", margin: 0, overflow: "hidden" }}>{aciklama}</p>
        </div>
      </div>

      <div className="veli-poster-template-footer" style={{ ...footerStyle, flexShrink: 0, padding: "12px 20px 16px", display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(14,165,233,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(14,165,233,0.4)" }}>
          <svg width={16} height={16} fill="none" stroke="#0ea5e9" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div style={{ minWidth: 0 }}>
          {form.isim && <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.isim}</div>}
          <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.rol || "Öğretmen / Yurt Hocası"}</div>
        </div>
      </div>
    </div>
  );
}
