import { useState } from "react";
import { api, type KullaniciBilgisi } from "../lib/api";
import { backendApi } from "../lib/backendApi";
import { APP_BRAND_TAGLINE, APP_BRAND_TITLE, APP_LOGO_ALT, APP_LOGO_SRC } from "../lib/appLogo";

interface Props {
  onGiris: (kullanici: KullaniciBilgisi) => void;
}

export default function GirisEkrani({ onGiris }: Props) {
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata("");
    setYukleniyor(true);
    try {
      const r = await api.girisYap(email, sifre);
      void backendApi.usageEvent("login", { source: "veli_bilgilendirme", mode: "giris" }).catch(() => {});
      onGiris(r.user);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #1e4d8c 70%, #2563eb 100%)",
      padding: "24px 16px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Arka plan dekoratif elementler */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {/* Büyük daire - sol üst */}
        <div style={{
          position: "absolute", top: "-80px", left: "-80px",
          width: 300, height: 300, borderRadius: "50%",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }} />
        {/* Orta daire - sağ */}
        <div style={{
          position: "absolute", top: "20%", right: "-60px",
          width: 220, height: 220, borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }} />
        {/* Küçük daire - alt sol */}
        <div style={{
          position: "absolute", bottom: "10%", left: "5%",
          width: 150, height: 150, borderRadius: "50%",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.05)",
        }} />
        {/* Kitap ikonları */}
        {[
          { top: "8%", left: "10%", opacity: 0.07, size: 40 },
          { top: "75%", left: "80%", opacity: 0.06, size: 50 },
          { top: "50%", left: "3%", opacity: 0.05, size: 35 },
          { top: "15%", right: "8%", opacity: 0.07, size: 45 },
        ].map((s, i) => (
          <svg key={i} style={{ position: "absolute", ...s, width: s.size, height: s.size, color: "#fff" }}
            fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" fill="none" />
          </svg>
        ))}
        {/* Mezuniyet şapkası */}
        <svg style={{ position: "absolute", bottom: "20%", right: "6%", opacity: 0.06, width: 60, height: 60 }}
          fill="white" viewBox="0 0 24 24">
          <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
        </svg>
      </div>

      {/* Kart */}
      <div style={{
        width: "100%", maxWidth: 420,
        background: "rgba(255,255,255,0.97)",
        borderRadius: 24,
        boxShadow: "0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)",
        padding: "36px 32px",
        position: "relative",
        backdropFilter: "blur(20px)",
      }}>
        {/* Logo ve başlık */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img
            src={APP_LOGO_SRC}
            alt={APP_LOGO_ALT}
            style={{
              width: 132,
              height: 132,
              objectFit: "contain",
              margin: "0 auto 18px",
              display: "block",
              borderRadius: 26,
              background: "#fff",
              padding: 6,
              boxShadow: "0 10px 28px rgba(15, 23, 42, 0.12)",
            }}
          />
          <h1 style={{
            fontSize: 20, fontWeight: 800, color: "#0f172a",
            lineHeight: 1.2, marginBottom: 6,
          }}>
            {APP_BRAND_TITLE}
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.4 }}>
            {APP_BRAND_TAGLINE}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={gonder} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
              E-posta Adresi
            </label>
            <input
              type="email"
              placeholder="ornek@okul.edu.tr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%", padding: "13px 16px",
                borderRadius: 12, border: "1.5px solid #e2e8f0",
                fontSize: 15, color: "#0f172a", outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
                background: "#fafafa",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2d5a9e")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
              Şifre
            </label>
            <input
              type="password"
              placeholder="Şifrenizi girin"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              required
              style={{
                width: "100%", padding: "13px 16px",
                borderRadius: 12, border: "1.5px solid #e2e8f0",
                fontSize: 15, color: "#0f172a", outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
                background: "#fafafa",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2d5a9e")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          {hata && (
            <div style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              fontSize: 13,
              fontWeight: 600,
            }}>
              ⚠️ {hata}
            </div>
          )}

          <button
            type="submit"
            disabled={yukleniyor}
            style={{
              width: "100%", padding: "15px",
              borderRadius: 14, border: "none",
              background: yukleniyor
                ? "#94a3b8"
                : "linear-gradient(135deg, #1e3a5f 0%, #2d5a9e 100%)",
              color: "#ffffff", fontWeight: 800,
              fontSize: 15, cursor: yukleniyor ? "not-allowed" : "pointer",
              marginTop: 4,
              boxShadow: yukleniyor ? "none" : "0 4px 16px rgba(30,58,95,0.35)",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
            {yukleniyor ? (
              <>
                <span style={{
                  width: 18, height: 18,
                  borderRadius: "50%",
                  border: "2.5px solid rgba(255,255,255,0.35)",
                  borderTopColor: "#fff",
                  animation: "spin 0.7s linear infinite",
                  display: "inline-block",
                }} />
                Giriş yapılıyor...
              </>
            ) : (
              "Giriş Yap"
            )}
          </button>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

