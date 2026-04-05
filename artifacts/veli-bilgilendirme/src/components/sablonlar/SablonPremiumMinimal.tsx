import { FormData } from "../../types";
import { baslikolustur } from "../../lib/dil";

interface Props { form: FormData; tarih: string; }

export default function SablonPremiumMinimal({ form, tarih }: Props) {
  const baslik = baslikolustur(form);
  const aciklama = form.posterMetni;
  const aktif = form.faaliyetler.slice(0, form.faaliyetSayisi).filter((f) => f.tur || f.alan);

  return (
    <div style={{ width: "100%", background: "#ffffff", fontFamily: "'Inter', Arial, sans-serif", borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0" }}>
      {/* Üst ince şerit */}
      <div style={{ height: 5, background: "linear-gradient(90deg, #334155 0%, #64748b 50%, #94a3b8 100%)" }} />

      {/* Kapak Görsel - eğer varsa */}
      {form.gorseller.length > 0 && (
        <div style={{ height: 240, overflow: "hidden" }}>
          <img src={form.gorseller[0]} alt="Kapak" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      )}

      {/* Başlık alanı */}
      <div style={{ padding: form.gorseller.length > 0 ? "24px 32px 16px" : "32px 32px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          {form.kurumAdi && (
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8" }}>
              {form.kurumAdi}
            </span>
          )}
          <span style={{ fontSize: 11, color: "#cbd5e1", marginLeft: "auto" }}>{tarih}</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.25, letterSpacing: "-0.02em" }}>
          {baslik}
        </h1>
      </div>

      {/* İnce ayraç */}
      <div style={{ height: 1, background: "#f1f5f9", margin: "0 32px" }} />

      {/* Faaliyet etiketleri */}
      {aktif.length > 0 && (
        <div style={{ padding: "16px 32px", display: "flex", flexWrap: "wrap", gap: 8 }}>
          {aktif.map((f, i) => (
            <span key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 20,
              background: "#f8fafc", border: "1px solid #e2e8f0",
              fontSize: 12, fontWeight: 600, color: "#334155",
            }}>
              {f.tur && <span style={{ color: "#94a3b8" }}>{f.tur}</span>}
              {f.tur && f.alan && <span style={{ color: "#cbd5e1" }}>·</span>}
              {f.alan && <span>{f.alan}</span>}
            </span>
          ))}
        </div>
      )}

      {/* Metin */}
      <div style={{ padding: aktif.length > 0 ? "0 32px 24px" : "16px 32px 24px" }}>
        <p style={{ fontSize: 14, lineHeight: 1.85, color: "#475569", margin: 0 }}>
          {aciklama}
        </p>
      </div>

      {/* Küçük görsel sırası (2+ görsel varsa) */}
      {form.gorseller.length > 1 && (
        <div style={{ padding: "0 32px 24px", display: "flex", gap: 8 }}>
          {form.gorseller.slice(1, 4).map((g, i) => (
            <div key={i} style={{ flex: 1, borderRadius: 10, overflow: "hidden" }}>
              <img src={g} alt={`Görsel ${i + 2}`} style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} />
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: "16px 32px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          {form.isim && <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{form.isim}</p>}
          <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>{form.rol || "Öğretmen / Yurt Hocası"}</p>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={18} height={18} fill="none" stroke="#64748b" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      </div>
    </div>
  );
}
