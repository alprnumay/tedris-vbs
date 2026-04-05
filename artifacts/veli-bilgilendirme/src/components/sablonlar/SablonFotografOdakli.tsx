import { FormData } from "../../types";
import { baslikolustur } from "../../lib/dil";

interface Props { form: FormData; tarih: string; }

export default function SablonFotografOdakli({ form, tarih }: Props) {
  const baslik = baslikolustur(form);
  const aciklama = form.posterMetni;
  const aktif = form.faaliyetler.slice(0, form.faaliyetSayisi).filter((f) => f.tur || f.alan);
  const gorseller = form.gorseller;

  return (
    <div style={{ width: "100%", background: "#0f172a", fontFamily: "'Inter', Arial, sans-serif", borderRadius: 16, overflow: "hidden" }}>
      {/* Görsel mozaik */}
      {gorseller.length === 0 && (
        <div style={{ height: 280, background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📸</div>
            <div style={{ fontSize: 13, color: "#475569" }}>Fotoğraf ekleyin</div>
          </div>
        </div>
      )}

      {gorseller.length === 1 && (
        <div style={{ position: "relative", height: 300 }}>
          <img src={gorseller[0]} alt="Kapak" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(15,23,42,0.9) 100%)" }} />
          <div style={{ position: "absolute", bottom: 16, left: 20, right: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: 0, lineHeight: 1.25, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{baslik}</h1>
          </div>
        </div>
      )}

      {gorseller.length === 2 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: 280, position: "relative" }}>
          {gorseller.map((g, i) => (
            <div key={i} style={{ overflow: "hidden" }}>
              <img src={g} alt={`Görsel ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ))}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(15,23,42,0.85) 100%)" }} />
          <div style={{ position: "absolute", bottom: 16, left: 20, right: 20 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", margin: 0, lineHeight: 1.25 }}>{baslik}</h1>
          </div>
        </div>
      )}

      {gorseller.length === 3 && (
        <div style={{ height: 280, position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", height: "100%" }}>
            <img src={gorseller[0]} alt="G1" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ display: "grid", gridTemplateRows: "1fr 1fr" }}>
              {gorseller.slice(1, 3).map((g, i) => (
                <img key={i} src={g} alt={`G${i + 2}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ))}
            </div>
          </div>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(15,23,42,0.9) 100%)" }} />
          <div style={{ position: "absolute", bottom: 16, left: 20, right: 20 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", margin: 0, lineHeight: 1.25 }}>{baslik}</h1>
          </div>
        </div>
      )}

      {gorseller.length >= 4 && (
        <div style={{ height: 280, position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", height: "100%" }}>
            {gorseller.slice(0, 4).map((g, i) => (
              <img key={i} src={g} alt={`G${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            ))}
          </div>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(15,23,42,0.92) 100%)" }} />
          <div style={{ position: "absolute", bottom: 16, left: 20, right: 20 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", margin: 0, lineHeight: 1.25 }}>{baslik}</h1>
          </div>
        </div>
      )}

      {/* Başlık (tek görsel yoksa) */}
      {gorseller.length <= 1 && gorseller.length === 0 && (
        <div style={{ padding: "16px 20px 0" }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc", margin: 0, lineHeight: 1.3 }}>{baslik}</h1>
        </div>
      )}

      {/* Bilgi şeridi */}
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {aktif.map((f, i) => (
            <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,0.1)", color: "#94a3b8", fontWeight: 600 }}>
              {f.alan || f.tur}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#475569", flexShrink: 0, marginLeft: 8 }}>{tarih}</div>
      </div>

      {/* Metin alanı */}
      <div style={{ padding: "16px 20px" }}>
        {form.kurumAdi && (
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#0ea5e9", marginBottom: 8 }}>
            {form.kurumAdi}
          </div>
        )}
        <p style={{ fontSize: 13, lineHeight: 1.75, color: "#cbd5e1", margin: 0 }}>{aciklama}</p>
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 20px 16px", display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(14,165,233,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(14,165,233,0.4)" }}>
          <svg width={16} height={16} fill="none" stroke="#0ea5e9" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          {form.isim && <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{form.isim}</div>}
          <div style={{ fontSize: 11, color: "#64748b" }}>{form.rol || "Öğretmen / Yurt Hocası"}</div>
        </div>
      </div>
    </div>
  );
}
