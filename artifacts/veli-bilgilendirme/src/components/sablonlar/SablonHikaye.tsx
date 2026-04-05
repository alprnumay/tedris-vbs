import { FormData } from "../../types";
import { baslikolustur } from "../../lib/dil";

interface Props { form: FormData; tarih: string; }

export default function SablonHikaye({ form, tarih }: Props) {
  const baslik = baslikolustur(form);
  const aciklama = form.posterMetni;
  const aktif = form.faaliyetler.slice(0, form.faaliyetSayisi).filter((f) => f.tur || f.alan);

  return (
    <div style={{ width: "100%", background: "#fdf8f0", fontFamily: "'Georgia', 'Times New Roman', serif", borderRadius: 16, overflow: "hidden", border: "1px solid #e8d5b0" }}>
      {/* Dekoratif üst şerit */}
      <div style={{ height: 8, background: "repeating-linear-gradient(90deg, #d4a373 0px, #d4a373 20px, #e9c46a 20px, #e9c46a 40px, #a8c5a0 40px, #a8c5a0 60px, #7fb3c8 60px, #7fb3c8 80px)" }} />

      {/* Başlık bölümü - mektup stili */}
      <div style={{ padding: "24px 32px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          {form.kurumAdi && (
            <div style={{ fontSize: 12, fontWeight: 600, color: "#8a6a3a", fontFamily: "'Inter', Arial, sans-serif" }}>
              {form.kurumAdi}
            </div>
          )}
          <div style={{ fontSize: 12, color: "#a08060", fontFamily: "'Inter', Arial, sans-serif", marginLeft: "auto" }}>{tarih}</div>
        </div>
        <div style={{ fontSize: 15, color: "#6b4c2a", fontStyle: "italic", marginBottom: 8, fontFamily: "'Georgia', serif" }}>
          Değerli Velimiz,
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#3d2b1a", margin: "0 0 4px", lineHeight: 1.3 }}>
          {baslik}
        </h1>
      </div>

      {/* Çizgili kağıt efekti */}
      <div style={{ margin: "0 32px", height: 1, background: "#e8d5b0" }} />

      {/* Görseller */}
      {form.gorseller.length > 0 && (
        <div style={{ padding: "16px 32px 0" }}>
          {form.gorseller.length === 1 ? (
            <div style={{ borderRadius: 12, overflow: "hidden", border: "3px solid #e8d5b0", boxShadow: "3px 3px 0 #d4b896" }}>
              <img src={form.gorseller[0]} alt="Görsel" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 2, borderRadius: 12, overflow: "hidden", border: "3px solid #e8d5b0", boxShadow: "3px 3px 0 #d4b896" }}>
                <img src={form.gorseller[0]} alt="Görsel 1" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
              </div>
              {form.gorseller.length > 1 && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  {form.gorseller.slice(1, 3).map((g, i) => (
                    <div key={i} style={{ borderRadius: 8, overflow: "hidden", border: "2px solid #e8d5b0", flex: 1 }}>
                      <img src={g} alt={`Görsel ${i + 2}`} style={{ width: "100%", height: 86, objectFit: "cover", display: "block" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Faaliyetler - liste stili */}
      {aktif.length > 0 && (
        <div style={{ padding: "16px 32px 0" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#8a6a3a", marginBottom: 8, fontFamily: "'Inter', Arial, sans-serif", fontStyle: "italic" }}>
            Bu gün neler yaptık?
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {aktif.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>✦</span>
                <div>
                  <span style={{ fontSize: 14, color: "#3d2b1a", fontWeight: 600 }}>
                    {f.alan || f.tur}
                  </span>
                  {f.tur && f.alan && (
                    <span style={{ fontSize: 12, color: "#8a6a3a", marginLeft: 6, fontStyle: "italic" }}>
                      ({f.tur})
                    </span>
                  )}
                  {f.ozelNot && (
                    <p style={{ fontSize: 12, color: "#6b5030", margin: "2px 0 0", lineHeight: 1.5, fontStyle: "italic" }}>{f.ozelNot}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ana metin */}
      <div style={{ padding: "16px 32px" }}>
        <p style={{ fontSize: 14, lineHeight: 2, color: "#3d2b1a", margin: 0 }}>{aciklama}</p>
      </div>

      {/* Ayraç */}
      <div style={{ margin: "0 32px", height: 1, background: "#e8d5b0" }} />

      {/* Kapanış - mektup stili */}
      <div style={{ padding: "14px 32px 20px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, fontStyle: "italic", color: "#6b4c2a", marginBottom: 8 }}>
            Saygılarımızla,
          </div>
          {form.isim && (
            <div style={{ fontSize: 14, fontWeight: 700, color: "#3d2b1a", fontFamily: "'Inter', Arial, sans-serif" }}>{form.isim}</div>
          )}
          <div style={{ fontSize: 11, color: "#8a6a3a", fontFamily: "'Inter', Arial, sans-serif" }}>{form.rol || "Öğretmen / Yurt Hocası"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", border: "2px dashed #d4a373", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 24 }}>📚</span>
          </div>
        </div>
      </div>
    </div>
  );
}
