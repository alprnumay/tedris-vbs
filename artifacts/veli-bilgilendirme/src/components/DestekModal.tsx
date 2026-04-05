import { useState, useRef } from "react";
import { api } from "../lib/api";

interface Props {
  onKapat: () => void;
  kullanici?: { email: string; name: string } | null;
}

function dosyayaBase64Cevir(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DestekModal({ onKapat, kullanici }: Props) {
  const [mesaj, setMesaj] = useState("");
  const [gorsel, setGorsel] = useState<string | null>(null);
  const [gorselAd, setGorselAd] = useState("");
  const [gonderiyor, setGonderiyor] = useState(false);
  const [sonuc, setSonuc] = useState<"ok" | "hata" | null>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);

  const gorselSec = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Görsel 5 MB'dan küçük olmalıdır.");
      return;
    }
    const b64 = await dosyayaBase64Cevir(file);
    setGorsel(b64);
    setGorselAd(file.name);
    e.target.value = "";
  };

  const gonder = async () => {
    if (!mesaj.trim()) return;
    setGonderiyor(true);
    try {
      await api.destekGonder(mesaj.trim(), gorsel ?? undefined);
      setSonuc("ok");
    } catch {
      setSonuc("hata");
    } finally {
      setGonderiyor(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15,23,42,0.6)",
      display: "flex", alignItems: "flex-end",
      backdropFilter: "blur(4px)",
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onKapat(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480, margin: "0 auto",
        background: "#fff", borderRadius: "24px 24px 0 0",
        padding: "24px 20px 32px",
        boxShadow: "0 -20px 60px rgba(0,0,0,0.2)",
        maxHeight: "90dvh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width={20} height={20} fill="none" stroke="#fff" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", margin: 0 }}>Destek Talebi</p>
              <p style={{ fontSize: 11, color: "#64748b", margin: "1px 0 0" }}>En kısa sürede dönüş yapılır</p>
            </div>
          </div>
          <button onClick={onKapat} style={{
            width: 32, height: 32, borderRadius: "50%", border: "none",
            background: "#f1f5f9", color: "#64748b", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>×</button>
        </div>

        {sonuc === "ok" ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#dcfce7", border: "2px solid #86efac",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width={32} height={32} fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", marginBottom: 6 }}>Mesajınız Alındı!</p>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>
              En kısa sürede size geri döneceğiz.
            </p>
            <button onClick={onKapat} style={{
              width: "100%", padding: 14, borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
              color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
            }}>Kapat</button>
          </div>
        ) : (
          <>
            {kullanici && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "#f8fafc", borderRadius: 12, padding: "10px 12px", marginBottom: 16,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 13, fontWeight: 800, flexShrink: 0,
                }}>
                  {kullanici.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0 }}>{kullanici.name}</p>
                  <p style={{ fontSize: 11, color: "#64748b", margin: "1px 0 0" }}>{kullanici.email}</p>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 700, color: "#475569",
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8,
              }}>
                Mesajınız *
              </label>
              <textarea
                value={mesaj}
                onChange={(e) => setMesaj(e.target.value)}
                placeholder="Yaşadığınız sorunu veya önerinizi buraya yazın..."
                rows={5}
                style={{
                  width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 12,
                  padding: "12px 14px", fontSize: 14, color: "#1e293b",
                  background: "#fff", resize: "vertical", outline: "none",
                  fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 700, color: "#475569",
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8,
              }}>
                Ekran Görüntüsü (İsteğe Bağlı)
              </label>
              {gorsel ? (
                <div style={{
                  borderRadius: 12, border: "1.5px solid #e2e8f0", overflow: "hidden",
                  position: "relative",
                }}>
                  <img src={gorsel} alt="Ekran görüntüsü" style={{
                    width: "100%", maxHeight: 200, objectFit: "cover", display: "block",
                  }} />
                  <button onClick={() => { setGorsel(null); setGorselAd(""); }} style={{
                    position: "absolute", top: 8, right: 8,
                    width: 28, height: 28, borderRadius: "50%", border: "none",
                    background: "rgba(15,23,42,0.7)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: 14,
                  }}>×</button>
                  <div style={{ padding: "8px 12px", background: "#f8fafc" }}>
                    <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{gorselAd}</p>
                  </div>
                </div>
              ) : (
                <button onClick={() => dosyaRef.current?.click()} style={{
                  width: "100%", padding: "12px", borderRadius: 12,
                  border: "1.5px dashed #cbd5e1", background: "#f8fafc",
                  color: "#64748b", cursor: "pointer", fontSize: 13,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Fotoğraf veya Ekran Görüntüsü Ekle
                </button>
              )}
              <input
                ref={dosyaRef}
                type="file"
                accept="image/*"
                onChange={gorselSec}
                style={{ display: "none" }}
              />
            </div>

            {sonuc === "hata" && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 10, padding: "10px 12px", marginBottom: 14,
                fontSize: 13, color: "#dc2626",
              }}>
                Gönderim sırasında hata oluştu. Tekrar deneyin.
              </div>
            )}

            <button
              onClick={gonder}
              disabled={gonderiyor || !mesaj.trim()}
              style={{
                width: "100%", padding: 14, borderRadius: 14, border: "none",
                background: mesaj.trim()
                  ? "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)"
                  : "#e2e8f0",
                color: mesaj.trim() ? "#fff" : "#94a3b8",
                fontWeight: 800, fontSize: 15, cursor: mesaj.trim() ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {gonderiyor
                ? <span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                : <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              }
              {gonderiyor ? "Gönderiliyor..." : "Gönder"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
