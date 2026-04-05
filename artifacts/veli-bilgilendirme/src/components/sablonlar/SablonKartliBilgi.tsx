import React from "react";
import { FormData } from "../../types";
import { baslikolustur } from "../../lib/dil";

interface Props { form: FormData; tarih: string; }

const renk = "#2563eb";

export default function SablonKartliBilgi({ form, tarih }: Props) {
  const baslik = baslikolustur(form);
  const aciklama = form.posterMetni;
  const aktif = form.faaliyetler.slice(0, form.faaliyetSayisi).filter((f) => f.tur || f.alan);

  const turIkon: Record<string, string> = {
    Ders: "📚", Etüt: "✏️", Gezi: "🗺️", Etkinlik: "🎨", Rehberlik: "💬",
  };

  return (
    <div style={{ width: "100%", background: "#f1f5f9", fontFamily: "'Inter', Arial, sans-serif", borderRadius: 16, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: renk, padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.7)" }}>
            Veli Bilgilendirmesi
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{tarih}</div>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", margin: "0 0 4px", lineHeight: 1.3 }}>{baslik}</h1>
        {form.kurumAdi && (
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{form.kurumAdi}</div>
        )}
      </div>

      {/* İçerik */}
      <div style={{ padding: "16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Faaliyet Kartları */}
        {aktif.map((f, i) => (
          <div key={i} style={{
            background: "#ffffff", borderRadius: 14, padding: "14px 16px",
            display: "flex", alignItems: "flex-start", gap: 14,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>
              {turIkon[f.tur || ""] || "📋"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: renk }}>
                  {aktif.length > 1 ? `${i + 1}. Faaliyet` : "Faaliyet"}
                </span>
                {f.tur && (
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#eff6ff", color: renk, fontWeight: 600 }}>
                    {f.tur}
                  </span>
                )}
              </div>
              {f.alan && <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{f.alan}</div>}
              {f.ozelNot && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 1.5 }}>{f.ozelNot}</div>}
            </div>
          </div>
        ))}

        {/* Fotoğraflar */}
        {form.gorseller.length > 0 && (() => {
          const g = form.gorseller;
          const kutu: React.CSSProperties = { borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" };
          if (g.length === 1) return (
            <div style={kutu}>
              <img src={g[0]} alt="Görsel" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
            </div>
          );
          if (g.length === 2) return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {g.map((img, i) => <div key={i} style={kutu}><img src={img} alt={`Görsel ${i + 1}`} style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} /></div>)}
            </div>
          );
          if (g.length === 3) return (
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 8 }}>
              <div style={kutu}><img src={g[0]} alt="Görsel 1" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {g.slice(1).map((img, i) => <div key={i} style={kutu}><img src={img} alt={`Görsel ${i + 2}`} style={{ width: "100%", height: 86, objectFit: "cover", display: "block" }} /></div>)}
              </div>
            </div>
          );
          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {g.slice(0, 4).map((img, i) => <div key={i} style={kutu}><img src={img} alt={`Görsel ${i + 1}`} style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} /></div>)}
            </div>
          );
        })()}

        {/* Özet Kart */}
        <div style={{ background: "#ffffff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: renk, marginBottom: 8 }}>
            Faaliyet Özeti
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.75, color: "#334155", margin: 0 }}>{aciklama}</p>
        </div>

        {/* Footer Kart */}
        <div style={{ background: "#ffffff", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: renk, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width={20} height={20} fill="none" stroke="#fff" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            {form.isim && <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{form.isim}</div>}
            <div style={{ fontSize: 11, color: "#64748b" }}>{form.rol || "Öğretmen / Yurt Hocası"}</div>
          </div>
          {form.kurumAdi && (
            <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "right", maxWidth: 100, lineHeight: 1.3 }}>{form.kurumAdi}</div>
          )}
        </div>
      </div>
    </div>
  );
}
