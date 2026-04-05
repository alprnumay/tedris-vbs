import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hataVar: boolean;
  hata?: Error;
  hataMesaji?: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hataVar: false };
  }

  static getDerivedStateFromError(hata: Error): State {
    return { hataVar: true, hata, hataMesaji: hata?.message || String(hata) };
  }

  componentDidCatch(hata: Error, bilgi: { componentStack: string }) {
    console.error("Uygulama hatası:", hata, bilgi);
    try {
      localStorage.setItem("son_hata", JSON.stringify({
        mesaj: hata?.message,
        yigin: hata?.stack?.slice(0, 500),
        zaman: new Date().toISOString(),
      }));
    } catch {}
  }

  render() {
    if (this.state.hataVar) {
      return (
        <div style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #2563eb 100%)",
          padding: "24px 16px",
        }}>
          <div style={{
            width: "100%",
            maxWidth: 420,
            background: "rgba(255,255,255,0.97)",
            borderRadius: 24,
            padding: "32px 28px",
            textAlign: "center",
            boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: "#fef2f2", border: "2px solid #fecaca",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <svg width={32} height={32} fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
              Beklenmeyen Bir Hata Oluştu
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 16 }}>
              Uygulama yüklenirken bir sorun yaşandı. Sayfayı yenileyerek tekrar deneyin.
            </p>
            {this.state.hataMesaji && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 10, padding: "10px 12px", marginBottom: 16,
                textAlign: "left",
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", margin: "0 0 4px", textTransform: "uppercase" }}>
                  Hata Detayı
                </p>
                <p style={{ fontSize: 12, color: "#7f1d1d", margin: 0, wordBreak: "break-word", fontFamily: "monospace" }}>
                  {this.state.hataMesaji}
                </p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                width: "100%", padding: "14px",
                borderRadius: 14, border: "none",
                background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a9e 100%)",
                color: "#fff", fontWeight: 800,
                fontSize: 15, cursor: "pointer",
              }}
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
