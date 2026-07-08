import React from "react";
import { FormData } from "../../types";
import { baslikolustur } from "../../lib/dil";
import {
  POSTER_BODY_CLS,
  POSTER_FOOTER_CLS,
  POSTER_HEADER_CLS,
  POSTER_SHELL_CLS,
  posterBodyStyle,
  posterFooterStyle,
  posterHeaderStyle,
  posterShellStyle,
} from "../../lib/sablonlar/posterShell";
import { calculateCardSpacing, TemplateDescription, templatePhotoStyle, TemplateSubtitle, TemplateTitle } from "../../lib/sablonlar/templateLayoutEngine";

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
    <div className={POSTER_SHELL_CLS} style={{ ...posterShellStyle, background: "#f1f5f9", fontFamily: "'Inter', Arial, sans-serif", borderRadius: 16 }}>
      <div className={POSTER_HEADER_CLS} style={{ ...posterHeaderStyle, background: renk, padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.7)" }}>
            Veli Bilgilendirmesi
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{tarih}</div>
        </div>
        <TemplateTitle text={baslik} baseSize={20} style={{ fontWeight: 800, color: "#ffffff", margin: "0 0 4px" }}>{baslik}</TemplateTitle>
        {form.kurumAdi && (
          <TemplateSubtitle text={form.kurumAdi} baseSize={13} style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{form.kurumAdi}</TemplateSubtitle>
        )}
      </div>

      <div className={POSTER_BODY_CLS} style={{ ...posterBodyStyle, padding: "16px 16px", ...calculateCardSpacing({ itemCount: aktif.length + form.gorseller.length, textLength: aciklama.length, baseGap: 12 }) }}>
        {aktif.map((f, i) => (
          <div key={i} style={{
            background: "#ffffff", borderRadius: 14, padding: "14px 16px",
            display: "flex", alignItems: "flex-start", gap: 14, flexShrink: 0,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>
              {turIkon[f.tur || ""] || "📋"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
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

        {form.gorseller.length > 0 && (() => {
          const g = form.gorseller;
          const kutu: React.CSSProperties = { borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", flexShrink: 0 };
          if (g.length === 1) return (
            <div style={kutu}>
              <img src={g[0]} alt="Görsel" style={templatePhotoStyle({ height: 200 })} />
            </div>
          );
          if (g.length === 2) return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flexShrink: 0 }}>
              {g.map((img, i) => <div key={i} style={kutu}><img src={img} alt={`Görsel ${i + 1}`} style={templatePhotoStyle({ height: 140 })} /></div>)}
            </div>
          );
          if (g.length === 3) return (
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 8, flexShrink: 0 }}>
              <div style={kutu}><img src={g[0]} alt="Görsel 1" style={templatePhotoStyle({ height: 180 })} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {g.slice(1).map((img, i) => <div key={i} style={kutu}><img src={img} alt={`Görsel ${i + 2}`} style={templatePhotoStyle({ height: 86 })} /></div>)}
              </div>
            </div>
          );
          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flexShrink: 0 }}>
              {g.slice(0, 4).map((img, i) => <div key={i} style={kutu}><img src={img} alt={`Görsel ${i + 1}`} style={templatePhotoStyle({ height: 140 })} /></div>)}
            </div>
          );
        })()}

        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ background: "#ffffff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: renk, marginBottom: 8, flexShrink: 0 }}>
              Faaliyet Özeti
            </div>
            <TemplateDescription text={aciklama} fontSize={13} maxLines={8} style={{ color: "#334155", margin: 0, flex: 1 }}>{aciklama}</TemplateDescription>
          </div>
        </div>
      </div>

      <div className={POSTER_FOOTER_CLS} style={{ ...posterFooterStyle, margin: "0 16px 16px", background: "#ffffff", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, border: "1px solid #e2e8f0" }}>
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
  );
}
