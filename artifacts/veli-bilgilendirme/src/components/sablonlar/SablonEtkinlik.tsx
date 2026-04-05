import { FormData } from "../../types";
import { baslikolustur } from "../../lib/dil";

interface Props { form: FormData; tarih: string; }

function GorselGrid({ gorseller }: { gorseller: string[] }) {
  if (gorseller.length === 0) return null;
  if (gorseller.length === 1) {
    return (
      <div style={{ borderRadius: 12, overflow: "hidden" }}>
        <img src={gorseller[0]} alt="Görsel" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
      </div>
    );
  }
  if (gorseller.length === 2) return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {gorseller.map((g, i) => (
        <div key={i} style={{ borderRadius: 12, overflow: "hidden" }}>
          <img src={g} alt={`Görsel ${i + 1}`} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
        </div>
      ))}
    </div>
  );
  if (gorseller.length === 3) return (
    <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 8 }}>
      <div style={{ borderRadius: 12, overflow: "hidden" }}>
        <img src={gorseller[0]} alt="Görsel 1" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {gorseller.slice(1).map((g, i) => (
          <div key={i} style={{ borderRadius: 12, overflow: "hidden" }}>
            <img src={g} alt={`Görsel ${i + 2}`} style={{ width: "100%", height: 86, objectFit: "cover", display: "block" }} />
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {gorseller.slice(0, 4).map((g, i) => (
        <div key={i} style={{ borderRadius: 12, overflow: "hidden" }}>
          <img src={g} alt={`Görsel ${i + 1}`} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
        </div>
      ))}
    </div>
  );
}

export default function SablonEtkinlik({ form, tarih }: Props) {
  const baslik = baslikolustur(form);
  const aciklama = form.posterMetni;
  const aktifFaaliyetler = form.faaliyetler.slice(0, form.faaliyetSayisi).filter((f) => f.tur || f.alan);
  const ilkFaaliyet = aktifFaaliyetler[0];

  return (
    <div style={{ width: "100%", borderRadius: 16, overflow: "hidden", background: "#ffffff", fontFamily: "'Inter', Arial, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #14532d 0%, #16a34a 100%)", padding: "20px 24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.95)" }}>
            Veli Bilgilendirmesi
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{tarih}</div>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", margin: 0, lineHeight: 1.3 }}>{baslik}</h1>
        {form.kurumAdi && <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)", margin: "4px 0 0" }}>{form.kurumAdi}</p>}
      </div>

      {form.gorseller.length > 0 ? (
        <div style={{ padding: "16px 16px 0" }}>
          <GorselGrid gorseller={form.gorseller} />
        </div>
      ) : (
        <div style={{ margin: "16px 16px 0", padding: 20, borderRadius: 12, background: "#f0fdf4", border: "2px dashed #86efac", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#86efac", margin: 0 }}>Fotoğraflar burada görünür</p>
        </div>
      )}

      {aktifFaaliyetler.length > 0 && (
        <div style={{ padding: "12px 16px 0" }}>
          <div style={{ borderRadius: 10, padding: "10px 14px", background: "#f0fdf4", border: "1px solid #86efac", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            {aktifFaaliyetler.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {i > 0 && <span style={{ fontSize: 11, color: "#86efac", marginRight: 4 }}>·</span>}
                {f.tur && <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>{f.tur}</span>}
                {f.tur && f.alan && <span style={{ fontSize: 11, color: "#4ade80", margin: "0 2px" }}>—</span>}
                {f.alan && <span style={{ fontSize: 11, color: "#14532d" }}>{f.alan}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: 16 }}>
        <div style={{ borderRadius: 12, padding: 16, background: "#f0fdf4", border: "1px solid #86efac" }}>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: "#14532d", margin: 0 }}>{aciklama}</p>
        </div>
      </div>

      <div style={{ padding: "12px 16px", background: "#f8fafb", borderTop: "2px solid #f0fdf4", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          {form.isim && <p style={{ fontSize: 14, fontWeight: 700, color: "#14532d", margin: 0 }}>{form.isim}</p>}
          <p style={{ fontSize: 11, color: "#6b7280", margin: "2px 0 0" }}>{form.rol || "Sınıf Öğretmeni"}</p>
        </div>
        <div style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, fontWeight: 600, background: "#dcfce7", color: "#16a34a" }}>
          {ilkFaaliyet?.tur || "Etkinlik"}
        </div>
      </div>
    </div>
  );
}
