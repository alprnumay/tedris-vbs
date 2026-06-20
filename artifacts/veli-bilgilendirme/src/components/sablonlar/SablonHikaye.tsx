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

interface Props { form: FormData; tarih: string; }

export default function SablonHikaye({ form, tarih }: Props) {
  const baslik = baslikolustur(form);
  const aciklama = form.posterMetni;
  const aktif = form.faaliyetler.slice(0, form.faaliyetSayisi).filter((f) => f.tur || f.alan);

  return (
    <div className={POSTER_SHELL_CLS} style={{ ...posterShellStyle, background: "#fdf8f0", fontFamily: "'Georgia', 'Times New Roman', serif", borderRadius: 16, border: "1px solid #e8d5b0" }}>
      <div style={{ height: 8, background: "repeating-linear-gradient(90deg, #d4a373 0px, #d4a373 20px, #e9c46a 20px, #e9c46a 40px, #a8c5a0 40px, #a8c5a0 60px, #7fb3c8 60px, #7fb3c8 80px)", flexShrink: 0 }} />

      <div className={POSTER_HEADER_CLS} style={{ ...posterHeaderStyle, padding: "24px 32px 12px" }}>
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

      <div className={POSTER_BODY_CLS} style={{ ...posterBodyStyle, padding: "0 32px", gap: 14 }}>
        <div style={{ height: 1, background: "#e8d5b0", flexShrink: 0 }} />

        {form.gorseller.length > 0 && (
          <div style={{ paddingTop: 14, flexShrink: 0 }}>
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

        {aktif.length > 0 && (
          <div style={{ flexShrink: 0 }}>
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

        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 14, lineHeight: 2, color: "#3d2b1a", margin: 0, overflow: "hidden" }}>{aciklama}</p>
        </div>
      </div>

      <div style={{ margin: "0 32px", height: 1, background: "#e8d5b0", flexShrink: 0 }} />

      <div className={POSTER_FOOTER_CLS} style={{ ...posterFooterStyle, padding: "14px 32px 20px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
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
