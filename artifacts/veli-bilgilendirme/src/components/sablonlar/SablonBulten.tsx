import { FormData } from "../../types";
import { baslikolustur } from "../../lib/dil";

interface Props { form: FormData; tarih: string; }

function GorselAlan({ gorseller }: { gorseller: string[] }) {
  if (gorseller.length === 0) return null;
  if (gorseller.length === 1) {
    return (
      <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #d97706" }}>
        <img src={gorseller[0]} alt="Görsel" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
      </div>
    );
  }
  if (gorseller.length === 3) {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 2, borderRadius: 10, overflow: "hidden", border: "1px solid #d97706" }}>
          <img src={gorseller[0]} alt="Görsel 1" style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {gorseller.slice(1, 3).map((g, i) => (
            <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #d97706", flex: 1 }}>
              <img src={g} alt={`Görsel ${i + 2}`} style={{ width: "100%", height: 71, objectFit: "cover", display: "block" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {gorseller.slice(0, 4).map((g, i) => (
        <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #d97706" }}>
          <img src={g} alt={`Görsel ${i + 1}`} style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
        </div>
      ))}
    </div>
  );
}

export default function SablonBulten({ form, tarih }: Props) {
  const baslik = baslikolustur(form);
  const aciklama = form.posterMetni;
  const aktifFaaliyetler = form.faaliyetler.slice(0, form.faaliyetSayisi).filter((f) => f.tur || f.alan);

  const satirlar: { etiket: string; deger: string }[] = [];
  aktifFaaliyetler.forEach((f, i) => {
    const prefix = aktifFaaliyetler.length > 1 ? `${i + 1}. ` : "";
    if (f.tur) satirlar.push({ etiket: `${prefix}Faaliyet Türü`, deger: f.tur });
    if (f.alan) satirlar.push({ etiket: `${prefix}Ders / Alan`, deger: f.alan });
  });

  return (
    <div style={{ width: "100%", borderRadius: 16, overflow: "hidden", background: "#fdf6e3", border: "2px solid #d97706", fontFamily: "'Georgia', serif" }}>
      <div style={{ padding: "16px 24px", background: "linear-gradient(135deg, #78350f 0%, #b45309 100%)", borderBottom: "3px solid #d97706" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.7)", fontFamily: "'Inter', Arial, sans-serif", marginBottom: 4 }}>
              Veli Bilgilendirme Bülteni
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fef3c7", margin: 0, lineHeight: 1.3 }}>{baslik}</h1>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "'Inter', Arial, sans-serif", whiteSpace: "nowrap", marginLeft: 12, paddingTop: 20 }}>{tarih}</div>
        </div>
        {form.kurumAdi && (
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", fontFamily: "'Inter', Arial, sans-serif" }}>{form.kurumAdi}</div>
        )}
      </div>

      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        {form.gorseller.length > 0 && <GorselAlan gorseller={form.gorseller} />}

        {satirlar.length > 0 && (
          <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(217,119,6,0.3)" }}>
            {satirlar.map((s, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "42% 58%",
                background: i % 2 === 0 ? "rgba(120,53,15,0.04)" : "#fdf6e3",
                borderBottom: i < satirlar.length - 1 ? "1px solid rgba(217,119,6,0.15)" : "none",
              }}>
                <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#92400e", fontFamily: "'Inter', Arial, sans-serif" }}>{s.etiket}</div>
                <div style={{ padding: "8px 12px", fontSize: 11, color: "#451a03", fontFamily: "'Inter', Arial, sans-serif" }}>{s.deger}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex" }}>
          <div style={{ width: 4, borderRadius: 4, background: "#d97706", flexShrink: 0, marginRight: 14 }} />
          <p style={{ fontSize: 14, lineHeight: 1.8, color: "#451a03", margin: 0 }}>{aciklama}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px dashed rgba(217,119,6,0.5)" }}>
          <div>
            {form.isim && <p style={{ fontSize: 14, fontWeight: 700, color: "#78350f", margin: 0, fontFamily: "'Inter', Arial, sans-serif" }}>{form.isim}</p>}
            <p style={{ fontSize: 11, color: "#92400e", margin: "2px 0 0", fontFamily: "'Inter', Arial, sans-serif" }}>{form.rol || "Öğretmen / Yurt Hocası"}</p>
          </div>
          <div style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, fontWeight: 600, background: "#fef3c7", color: "#78350f", border: "1px solid #d97706", fontFamily: "'Inter', Arial, sans-serif" }}>
            Veliye Özel
          </div>
        </div>
      </div>
    </div>
  );
}
