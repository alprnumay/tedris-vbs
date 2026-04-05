import React from "react";
import { FormData } from "../../types";
import { baslikolustur } from "../../lib/dil";

interface Props { form: FormData; tarih: string; }

function GorselAlan({ gorseller }: { gorseller: string[] }) {
  const bos: React.CSSProperties = { borderRadius: 10, overflow: "hidden", border: "2px solid rgba(255,255,255,0.2)" };
  if (gorseller.length === 0) return null;
  if (gorseller.length === 1) return (
    <div style={bos}>
      <img src={gorseller[0]} alt="Görsel" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
    </div>
  );
  if (gorseller.length === 2) return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {gorseller.map((g, i) => (
        <div key={i} style={bos}>
          <img src={g} alt={`Görsel ${i + 1}`} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
        </div>
      ))}
    </div>
  );
  if (gorseller.length === 3) return (
    <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 8 }}>
      <div style={bos}>
        <img src={gorseller[0]} alt="Görsel 1" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {gorseller.slice(1).map((g, i) => (
          <div key={i} style={bos}>
            <img src={g} alt={`Görsel ${i + 2}`} style={{ width: "100%", height: 86, objectFit: "cover", display: "block" }} />
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {gorseller.slice(0, 4).map((g, i) => (
        <div key={i} style={bos}>
          <img src={g} alt={`Görsel ${i + 1}`} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
        </div>
      ))}
    </div>
  );
}

export default function SablonAkademik({ form, tarih }: Props) {
  const baslik = baslikolustur(form);
  const aciklama = form.posterMetni;
  const aktifFaaliyetler = form.faaliyetler.slice(0, form.faaliyetSayisi).filter((f) => f.tur || f.alan);

  return (
    <div style={{ width: "100%", borderRadius: 16, overflow: "hidden", background: "linear-gradient(160deg, #1e3a5f 0%, #2d5a9e 60%, #1a4a7a 100%)", fontFamily: "'Inter', Arial, sans-serif" }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "2px solid rgba(255,255,255,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
            Öğrenci Bilgi Formu
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{tarih}</div>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", margin: "8px 0 0", lineHeight: 1.3 }}>{baslik}</h1>
        {form.kurumAdi && <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.75)", margin: "4px 0 0" }}>{form.kurumAdi}</p>}
      </div>

      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {form.gorseller.length > 0 && <GorselAlan gorseller={form.gorseller} />}

        {aktifFaaliyetler.length > 0 && (
          <div style={{ borderRadius: 12, padding: "12px 16px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            {aktifFaaliyetler.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 10, ...(i > 0 ? { marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.1)" } : {}) }}>
                {f.tur && <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", minWidth: 52 }}>{f.tur}</span>}
                {f.alan && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{f.alan}</span>}
              </div>
            ))}
          </div>
        )}

        <div style={{ borderRadius: 12, padding: 16, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Faaliyet Özeti</div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.92)", margin: 0 }}>{aciklama}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <div>
            {form.isim && <p style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", margin: 0 }}>{form.isim}</p>}
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", margin: "2px 0 0" }}>{form.rol || "Sınıf Öğretmeni / Sorumlu Hoca"}</p>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Veli Bilgilendirme Formu</div>
        </div>
      </div>
    </div>
  );
}
