import { useState, useEffect } from "react";
import { api, type DestekMesaji, type AdminStats } from "../lib/api";

type Sekme = "genel" | "mesajlar" | "kullanicilar";

function StatKart({ baslik, deger, renk, simge }: { baslik: string; deger: number; renk: string; simge: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #e2e8f0", flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{simge}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: renk, lineHeight: 1 }}>{deger}</div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: 600 }}>{baslik}</div>
    </div>
  );
}

function GunlukGrafik({ dailyUsers, dailyPosters }: { dailyUsers: { day: string; count: number }[]; dailyPosters: { day: string; count: number }[] }) {
  const today = new Date();
  const gunler = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const gunAd = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"][d.getDay()];
    return {
      key,
      label: gunAd,
      users: dailyUsers.find((r) => r.day === key)?.count ?? 0,
      posters: dailyPosters.find((r) => r.day === key)?.count ?? 0,
    };
  });

  const maxVal = Math.max(1, ...gunler.map((g) => Math.max(g.users, g.posters)));
  const CHART_H = 100;
  const CHART_W = 280;
  const barW = 14;
  const groupW = CHART_W / 7;

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "18px", border: "1.5px solid #e2e8f0" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Son 7 Gün Aktivitesi</div>
      <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "#2563eb", display: "inline-block" }} />
          Kullanıcı
        </span>
        <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "#16a34a", display: "inline-block" }} />
          Afiş
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${CHART_W} ${CHART_H + 20}`} style={{ overflow: "visible" }}>
        {gunler.map((g, i) => {
          const x = i * groupW + groupW / 2;
          const uH = (g.users / maxVal) * CHART_H;
          const pH = (g.posters / maxVal) * CHART_H;
          return (
            <g key={g.key}>
              <rect
                x={x - barW - 1}
                y={CHART_H - uH}
                width={barW}
                height={uH || 2}
                rx={3}
                fill="#2563eb"
                opacity={0.85}
              />
              <rect
                x={x + 1}
                y={CHART_H - pH}
                width={barW}
                height={pH || 2}
                rx={3}
                fill="#16a34a"
                opacity={0.85}
              />
              {g.users > 0 && (
                <text x={x - barW / 2 - 1} y={CHART_H - uH - 3} textAnchor="middle" fontSize={9} fill="#2563eb" fontWeight="700">{g.users}</text>
              )}
              {g.posters > 0 && (
                <text x={x + barW / 2 + 1} y={CHART_H - pH - 3} textAnchor="middle" fontSize={9} fill="#16a34a" fontWeight="700">{g.posters}</text>
              )}
              <text x={x} y={CHART_H + 14} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight="600">{g.label}</text>
            </g>
          );
        })}
        <line x1={0} y1={CHART_H} x2={CHART_W} y2={CHART_H} stroke="#e2e8f0" strokeWidth={1} />
      </svg>
    </div>
  );
}

function formatTarih(iso: string): string {
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminSayfasi() {
  const [aktifSekme, setAktifSekme] = useState<Sekme>("genel");
  const [mesajlar, setMesajlar] = useState<DestekMesaji[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.destekMesajlari(),
      api.adminStats(),
    ])
      .then(([m, s]) => {
        setMesajlar(m.requests.slice().reverse());
        setStats(s);
      })
      .catch(() => setHata("Veriler yüklenemedi."))
      .finally(() => setYukleniyor(false));
  }, []);

  const sekmeler: { id: Sekme; label: string; simge: string }[] = [
    { id: "genel", label: "Genel Bakış", simge: "📊" },
    { id: "mesajlar", label: "Destek", simge: "💬" },
    { id: "kullanicilar", label: "Kullanıcılar", simge: "👥" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>

      <header style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2563eb 100%)", padding: "16px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            🛡️
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 }}>Yönetim Paneli</h1>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", margin: "2px 0 0" }}>Tedris VBS</p>
          </div>
          <a href="/" style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", textDecoration: "none", padding: "7px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)" }}>
            ← Uygulamaya Dön
          </a>
        </div>
      </header>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px" }}>

        <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 12, padding: 4, border: "1.5px solid #e2e8f0", marginBottom: 20 }}>
          {sekmeler.map((s) => (
            <button key={s.id} onClick={() => setAktifSekme(s.id)}
              style={{ flex: 1, padding: "9px 4px", borderRadius: 9, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.15s",
                background: aktifSekme === s.id ? "linear-gradient(135deg, #1e3a5f, #2563eb)" : "transparent",
                color: aktifSekme === s.id ? "#fff" : "#64748b" }}>
              {s.simge} {s.label}
            </button>
          ))}
        </div>

        {yukleniyor && (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 14 }}>
            Yükleniyor...
          </div>
        )}

        {hata && (
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "#fee2e2", color: "#991b1b", fontSize: 14, fontWeight: 600 }}>
            {hata}
          </div>
        )}

        {!yukleniyor && !hata && aktifSekme === "genel" && stats && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <StatKart baslik="Toplam Kullanıcı" deger={stats.totalUsers} renk="#2563eb" simge="👤" />
              <StatKart baslik="Toplam Afiş" deger={stats.totalPosters} renk="#16a34a" simge="📋" />
              <StatKart baslik="Destek Talebi" deger={stats.totalSupport} renk="#f59e0b" simge="💬" />
            </div>

            <GunlukGrafik dailyUsers={stats.dailyUsers} dailyPosters={stats.dailyPosters} />

            <div style={{ background: "#fff", borderRadius: 14, padding: "18px", border: "1.5px solid #e2e8f0" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Son Kayıtlar</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {stats.recentUsers.slice(0, 5).map((u, i) => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                    borderBottom: i < Math.min(stats.recentUsers.length, 5) - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #1e3a5f, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, flexShrink: 0 }}>{u.created_at}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!yukleniyor && !hata && aktifSekme === "mesajlar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {mesajlar.length} mesaj — en yeniden eskiye
            </p>
            {mesajlar.length === 0 && (
              <div style={{ textAlign: "center", padding: 48, color: "#94a3b8", fontSize: 14 }}>
                Henüz destek mesajı gelmedi.
              </div>
            )}
            {mesajlar.map((m) => (
              <div key={m.id} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #1e3a5f, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {(m.userName || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{m.userName || "İsimsiz"}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{m.userEmail || "—"}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textAlign: "right", flexShrink: 0 }}>
                    {formatTarih(m.createdAt)}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.65, whiteSpace: "pre-wrap", background: "#f8fafc", borderRadius: 8, padding: "10px 12px", border: "1px solid #e2e8f0" }}>
                  {m.message}
                </div>
              </div>
            ))}
          </div>
        )}

        {!yukleniyor && !hata && aktifSekme === "kullanicilar" && stats && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                Son Kayıt Olan Kullanıcılar
              </span>
              <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>({stats.recentUsers.length} kayıt)</span>
            </div>
            {stats.recentUsers.map((u, i) => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px",
                borderBottom: i < stats.recentUsers.length - 1 ? "1px solid #f1f5f9" : "none",
                background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `hsl(${(i * 47) % 360}, 60%, 45%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, flexShrink: 0, textAlign: "right" }}>
                  {u.created_at}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
