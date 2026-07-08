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

function GorselGrid({ gorseller }: { gorseller: string[] }) {
  if (gorseller.length === 0) return null;
  if (gorseller.length === 1) {
    return (
      <div style={{ borderRadius: 12, overflow: "hidden" }}>
        <img src={gorseller[0]} alt="Görsel" style={templatePhotoStyle({ height: 200 })} />
      </div>
    );
  }
  if (gorseller.length === 2) return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {gorseller.map((g, i) => (
        <div key={i} style={{ borderRadius: 12, overflow: "hidden" }}>
          <img src={g} alt={`Görsel ${i + 1}`} style={templatePhotoStyle({ height: 160 })} />
        </div>
      ))}
    </div>
  );
  if (gorseller.length === 3) return (
    <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 8 }}>
      <div style={{ borderRadius: 12, overflow: "hidden" }}>
        <img src={gorseller[0]} alt="Görsel 1" style={templatePhotoStyle({ height: 180 })} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {gorseller.slice(1).map((g, i) => (
          <div key={i} style={{ borderRadius: 12, overflow: "hidden" }}>
            <img src={g} alt={`Görsel ${i + 2}`} style={templatePhotoStyle({ height: 86 })} />
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {gorseller.slice(0, 4).map((g, i) => (
        <div key={i} style={{ borderRadius: 12, overflow: "hidden" }}>
          <img src={g} alt={`Görsel ${i + 1}`} style={templatePhotoStyle({ height: 160 })} />
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
    <div className={POSTER_SHELL_CLS} style={{ ...posterShellStyle, borderRadius: 16, background: "#ffffff", fontFamily: "'Inter', Arial, sans-serif" }}>
      <div className={POSTER_HEADER_CLS} style={{ ...posterHeaderStyle, background: "linear-gradient(135deg, #14532d 0%, #16a34a 100%)", padding: "20px 24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.95)" }}>
            Veli Bilgilendirmesi
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{tarih}</div>
        </div>
        <TemplateTitle text={baslik} baseSize={20} style={{ fontWeight: 800, color: "#ffffff", margin: 0 }}>{baslik}</TemplateTitle>
        {form.kurumAdi && <TemplateSubtitle text={form.kurumAdi} baseSize={14} style={{ fontWeight: 600, color: "rgba(255,255,255,0.8)", margin: "4px 0 0" }}>{form.kurumAdi}</TemplateSubtitle>}
      </div>

      <div className={POSTER_BODY_CLS} style={{ ...posterBodyStyle, background: "#ffffff", ...calculateCardSpacing({ itemCount: aktifFaaliyetler.length + form.gorseller.length, textLength: aciklama.length }) }}>
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

        <div style={{ padding: 16, flex: 1, minHeight: 0 }}>
          <div style={{ borderRadius: 12, padding: 16, background: "#f0fdf4", border: "1px solid #86efac" }}>
            <TemplateDescription text={aciklama} fontSize={14} maxLines={8} style={{ color: "#14532d", margin: 0 }}>{aciklama}</TemplateDescription>
          </div>
        </div>
      </div>

      <div className={POSTER_FOOTER_CLS} style={{ ...posterFooterStyle, padding: "12px 16px", background: "#f8fafb", borderTop: "2px solid #f0fdf4", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
