import React from "react";
import { FormData } from "../../types";
import { baslikolustur } from "../../lib/dil";
import {
  POSTER_BODY_CLS,
  POSTER_FOOTER_CLS,
  POSTER_SHELL_CLS,
  posterBodyStyle,
  posterFooterStyle,
  posterShellStyle,
} from "../../lib/sablonlar/posterShell";
import { calculateCardSpacing, TemplateDescription, templatePhotoStyle, TemplateSubtitle, TemplateTitle } from "../../lib/sablonlar/templateLayoutEngine";
import { PosterTemplateHeader } from "../veli/PosterTemplateHeader";

interface Props { form: FormData; tarih: string; }

function GorselAlan({ gorseller }: { gorseller: string[] }) {
  const bos: React.CSSProperties = {
    borderRadius: 10,
    overflow: "hidden",
    border: "2px solid rgba(255,255,255,0.2)",
    minWidth: 0,
    minHeight: 0,
  };
  const img: React.CSSProperties = {
    width: "100%",
    objectFit: "cover",
    display: "block",
    maxWidth: "100%",
  };
  if (gorseller.length === 0) return null;
  if (gorseller.length === 1) return (
    <div style={bos}>
      <img src={gorseller[0]} alt="Görsel" style={{ ...img, ...templatePhotoStyle({ height: 200 }) }} />
    </div>
  );
  if (gorseller.length === 2) return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {gorseller.map((g, i) => (
        <div key={i} style={bos}>
          <img src={g} alt={`Görsel ${i + 1}`} style={{ ...img, ...templatePhotoStyle({ height: 160 }) }} />
        </div>
      ))}
    </div>
  );
  if (gorseller.length === 3) return (
    <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 8 }}>
      <div style={bos}>
        <img src={gorseller[0]} alt="Görsel 1" style={{ ...img, ...templatePhotoStyle({ height: 180 }) }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {gorseller.slice(1).map((g, i) => (
          <div key={i} style={bos}>
            <img src={g} alt={`Görsel ${i + 2}`} style={{ ...img, ...templatePhotoStyle({ height: 86 }) }} />
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {gorseller.slice(0, 4).map((g, i) => (
        <div key={i} style={bos}>
          <img src={g} alt={`Görsel ${i + 1}`} style={{ ...img, ...templatePhotoStyle({ height: 160 }) }} />
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
    <div className={POSTER_SHELL_CLS} style={{ ...posterShellStyle, borderRadius: 16, background: "linear-gradient(160deg, #1e3a5f 0%, #2d5a9e 60%, #1a4a7a 100%)", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <PosterTemplateHeader style={{ padding: "22px 26px 18px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
            Öğrenci Bilgi Formu
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{tarih}</div>
        </div>
        <TemplateTitle text={baslik} baseSize={22} style={{ fontWeight: 800, color: "#ffffff", margin: "10px 0 0", letterSpacing: "-0.02em" }}>{baslik}</TemplateTitle>
        {form.kurumAdi && <TemplateSubtitle text={form.kurumAdi} baseSize={13} style={{ fontWeight: 600, color: "rgba(255,255,255,0.78)", margin: "6px 0 0", letterSpacing: "0.02em" }}>{form.kurumAdi}</TemplateSubtitle>}
      </PosterTemplateHeader>

      <div className={POSTER_BODY_CLS} style={{ ...posterBodyStyle, padding: "22px 26px 24px", ...calculateCardSpacing({ itemCount: aktifFaaliyetler.length + form.gorseller.length, textLength: aciklama.length, baseGap: 18 }) }}>
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

        <div style={{ borderRadius: 12, padding: 16, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)", flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.6)", marginBottom: 8, flexShrink: 0 }}>Faaliyet Özeti</div>
          <TemplateDescription text={aciklama} fontSize={14.5} maxLines={8} style={{ color: "rgba(255,255,255,0.94)", margin: 0, fontWeight: 450 }}>{aciklama}</TemplateDescription>
        </div>
      </div>

      <div className={POSTER_FOOTER_CLS} style={{ ...posterFooterStyle, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 26px 22px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
        <div>
          {form.isim && <p style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", margin: 0, letterSpacing: "-0.01em" }}>{form.isim}</p>}
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: "4px 0 0", fontWeight: 500 }}>{form.rol || "Sorumlu Hoca"}</p>
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Veli Bilgilendirme</div>
      </div>
    </div>
  );
}
