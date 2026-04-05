import React from "react";
import { FormData } from "../../types";
import { baslikolustur } from "../../lib/dil";

interface Props { form: FormData; tarih: string; }

export default function SablonKurumsalResmi({ form, tarih }: Props) {
  const baslik = baslikolustur(form);
  const aciklama = form.posterMetni;
  const aktif = form.faaliyetler.slice(0, form.faaliyetSayisi).filter((f) => f.tur || f.alan);

  return (
    <div style={{ width: "100%", background: "#ffffff", fontFamily: "'Times New Roman', Georgia, serif", borderRadius: 8, overflow: "hidden", border: "2px solid #1e293b" }}>
      {/* Üst çift çizgi */}
      <div style={{ borderBottom: "4px double #1e293b", padding: "20px 32px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#64748b", fontFamily: "'Inter', Arial, sans-serif", marginBottom: 8 }}>
          Resmî Veli Bilgilendirme Formu
        </div>
        {form.kurumAdi && (
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4, letterSpacing: "0.02em" }}>
            {form.kurumAdi.toUpperCase()}
          </div>
        )}
        <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'Inter', Arial, sans-serif" }}>{tarih}</div>
      </div>

      {/* Başlık */}
      <div style={{ padding: "16px 32px 12px", borderBottom: "1px solid #e2e8f0", textAlign: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0, lineHeight: 1.35, letterSpacing: "0.01em" }}>{baslik}</h1>
      </div>

      {/* Görsel - eğer varsa */}
      {form.gorseller.length > 0 && (() => {
        const g = form.gorseller;
        const kutu: React.CSSProperties = { border: "1px solid #cbd5e1", borderRadius: 4, overflow: "hidden" };
        const renderG = (imgs: string[], h: number) => imgs.map((img, i) => (
          <div key={i} style={kutu}><img src={img} alt={`Görsel ${i + 1}`} style={{ width: "100%", height: h, objectFit: "cover", display: "block" }} /></div>
        ));
        return (
          <div style={{ padding: "16px 32px 0" }}>
            {g.length === 1 && <div style={kutu}><img src={g[0]} alt="Görsel" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} /></div>}
            {g.length === 2 && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{renderG(g, 130)}</div>}
            {g.length === 3 && (
              <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 8 }}>
                <div style={kutu}><img src={g[0]} alt="Görsel 1" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} /></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {g.slice(1).map((img, i) => <div key={i} style={kutu}><img src={img} alt={`Görsel ${i + 2}`} style={{ width: "100%", height: 76, objectFit: "cover", display: "block" }} /></div>)}
                </div>
              </div>
            )}
            {g.length >= 4 && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{renderG(g.slice(0, 4), 130)}</div>}
          </div>
        );
      })()}

      {/* Faaliyet tablosu */}
      {aktif.length > 0 && (
        <div style={{ padding: "16px 32px 0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b", fontFamily: "'Inter', Arial, sans-serif", marginBottom: 8 }}>
            Gerçekleştirilen Faaliyetler
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#1e293b", borderBottom: "2px solid #1e293b", fontSize: 12, fontFamily: "'Inter', Arial, sans-serif" }}>Sıra</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#1e293b", borderBottom: "2px solid #1e293b", fontSize: 12, fontFamily: "'Inter', Arial, sans-serif" }}>Tür</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#1e293b", borderBottom: "2px solid #1e293b", fontSize: 12, fontFamily: "'Inter', Arial, sans-serif" }}>Alan / Ders</th>
              </tr>
            </thead>
            <tbody>
              {aktif.map((f, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "8px 12px", color: "#475569", fontFamily: "'Inter', Arial, sans-serif" }}>{i + 1}</td>
                  <td style={{ padding: "8px 12px", color: "#0f172a", fontFamily: "'Inter', Arial, sans-serif" }}>{f.tur || "—"}</td>
                  <td style={{ padding: "8px 12px", color: "#0f172a", fontFamily: "'Inter', Arial, sans-serif" }}>{f.alan || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Metin */}
      <div style={{ padding: "16px 32px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b", fontFamily: "'Inter', Arial, sans-serif", marginBottom: 8 }}>
          Genel Değerlendirme
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.9, color: "#0f172a", margin: 0, textAlign: "justify" }}>{aciklama}</p>
      </div>

      {/* İmza alanı */}
      <div style={{ padding: "20px 32px 20px", marginTop: 12, borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'Inter', Arial, sans-serif", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>İmza / Kaşe</div>
          <div style={{ width: 140, borderBottom: "1px solid #1e293b" }} />
          <div style={{ marginTop: 6 }}>
            {form.isim && <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: "'Inter', Arial, sans-serif" }}>{form.isim}</div>}
            <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'Inter', Arial, sans-serif" }}>{form.rol || "Öğretmen / Yurt Hocası"}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "'Inter', Arial, sans-serif", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Tarih</div>
          <div style={{ fontSize: 13, color: "#0f172a", fontFamily: "'Inter', Arial, sans-serif" }}>{tarih}</div>
        </div>
      </div>

      {/* Alt çift çizgi */}
      <div style={{ borderTop: "4px double #1e293b" }} />
    </div>
  );
}
