import { useState, useEffect, useCallback } from "react";
import {
  api,
  type AdminOverview,
  type AdminKullanici,
  type AdminKurum,
  type AdminDestek,
  type AdminFiltreler,
  type KullaniciRol,
} from "../lib/api";
import { kurumKoduOner, hatirlatmaMesaji } from "../lib/kurumSlug";
import {
  StatKart, DurumRozet, formatTarih, ROL_LABEL, inputStyle, labelStyle,
  FiltreSatir, FiltreAlan,
} from "./admin/adminUi";

type Sekme = "genel" | "bolge" | "kurumlar" | "kullanicilar" | "kullanim" | "destek";

const SEKMELER: { id: Sekme; label: string; simge: string }[] = [
  { id: "genel", label: "Genel Bakış", simge: "📊" },
  { id: "bolge", label: "Bölge Raporu", simge: "🗺️" },
  { id: "kurumlar", label: "Kurumlar", simge: "🏫" },
  { id: "kullanicilar", label: "Kullanıcılar", simge: "👥" },
  { id: "kullanim", label: "Kullanım Takibi", simge: "📉" },
  { id: "destek", label: "Destek", simge: "💬" },
];

function GunlukGrafik({ dailyLogins }: { dailyLogins: { day: string; count: number }[] }) {
  const today = new Date();
  const gunler = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const gunAd = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"][d.getDay()];
    return { key, label: gunAd, count: dailyLogins.find((r) => r.day === key)?.count ?? 0 };
  });
  const maxVal = Math.max(1, ...gunler.map((g) => g.count));
  const CHART_H = 90;
  const CHART_W = 280;
  const barW = 22;
  const groupW = CHART_W / 7;

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 18, border: "1.5px solid #e2e8f0" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Son 7 Gün Giriş</div>
      <svg width="100%" viewBox={`0 0 ${CHART_W} ${CHART_H + 20}`}>
        {gunler.map((g, i) => {
          const x = i * groupW + groupW / 2;
          const h = (g.count / maxVal) * CHART_H;
          return (
            <g key={g.key}>
              <rect x={x - barW / 2} y={CHART_H - h} width={barW} height={h || 2} rx={3} fill="#2563eb" opacity={0.85} />
              {g.count > 0 && <text x={x} y={CHART_H - h - 3} textAnchor="middle" fontSize={9} fill="#2563eb" fontWeight="700">{g.count}</text>}
              <text x={x} y={CHART_H + 14} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight="600">{g.label}</text>
            </g>
          );
        })}
        <line x1={0} y1={CHART_H} x2={CHART_W} y2={CHART_H} stroke="#e2e8f0" strokeWidth={1} />
      </svg>
    </div>
  );
}

export default function AdminSayfasi() {
  const [aktifSekme, setAktifSekme] = useState<Sekme>("genel");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [filtreler, setFiltreler] = useState<AdminFiltreler | null>(null);

  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [kurum, setKurum] = useState("");
  const [tarihAralik, setTarihAralik] = useState("7d");

  const [kullanicilar, setKullanicilar] = useState<AdminKullanici[]>([]);
  const [bugunGirisler, setBugunGirisler] = useState<AdminKullanici[]>([]);
  const [kurumlar, setKurumlar] = useState<AdminKurum[]>([]);
  const [bolgeRapor, setBolgeRapor] = useState<{ summary: Record<string, number>; users: AdminKullanici[] } | null>(null);
  const [kullanimTip, setKullanimTip] = useState("never");
  const [kullanimListe, setKullanimListe] = useState<AdminKullanici[]>([]);
  const [pasifKurumlar, setPasifKurumlar] = useState<unknown[]>([]);
  const [destekler, setDestekler] = useState<AdminDestek[]>([]);
  const [destekFiltre, setDestekFiltre] = useState("");

  const [arama, setArama] = useState("");
  const [rolFiltre, setRolFiltre] = useState("");
  const [aktifFiltre, setAktifFiltre] = useState("");

  const [yeniKullanici, setYeniKullanici] = useState({
    name: "", email: "", password: "", province: "", district: "",
    institutionName: "", institutionCode: "", role: "hoca" as KullaniciRol, isActive: true,
  });
  const [kayitMesaj, setKayitMesaj] = useState<string | null>(null);

  const filtreParams = useCallback(() => ({
    province: il || undefined,
    district: ilce || undefined,
    institutionCode: kurum || undefined,
  }), [il, ilce, kurum]);

  const veriYukle = useCallback(async () => {
    setYukleniyor(true);
    setHata(null);
    try {
      setHata(null);
      const fp = filtreParams();
      const results = await Promise.allSettled([
        api.adminOverview(),
        api.adminFiltreler(),
        api.adminBugunGirisler(fp),
        api.adminKurumlar(fp),
        api.adminBolgeRaporu({ ...fp, range: tarihAralik }),
        api.adminKullanicilar({ ...fp, search: arama || undefined, role: rolFiltre || undefined, active: aktifFiltre || undefined }),
        api.adminKullanimTakibi(kullanimTip, fp),
        api.adminDestek(),
      ]);

      const errMsgs: string[] = [];
      const get = <T,>(i: number): T | null => {
        const r = results[i];
        if (r.status === "fulfilled") return r.value as T;
        errMsgs.push(r.reason instanceof Error ? r.reason.message : "İstek başarısız");
        return null;
      };

      const ov = get<Awaited<ReturnType<typeof api.adminOverview>>>(0);
      const fl = get<Awaited<ReturnType<typeof api.adminFiltreler>>>(1);
      if (ov) setOverview(ov);
      if (fl) setFiltreler(fl);

      const bg = get<Awaited<ReturnType<typeof api.adminBugunGirisler>>>(2);
      const ku = get<Awaited<ReturnType<typeof api.adminKurumlar>>>(3);
      const br = get<Awaited<ReturnType<typeof api.adminBolgeRaporu>>>(4);
      const kl = get<Awaited<ReturnType<typeof api.adminKullanicilar>>>(5);
      const kt = get<Awaited<ReturnType<typeof api.adminKullanimTakibi>>>(6);
      const destek = get<Awaited<ReturnType<typeof api.adminDestek>>>(7);

      if (bg) setBugunGirisler(bg.logins);
      if (ku) setKurumlar(ku.institutions);
      if (br) setBolgeRapor(br);
      if (kl) setKullanicilar(kl.users);
      if (kt) {
        setKullanimListe(kt.users);
        setPasifKurumlar(kt.inactiveInstitutions);
      }
      if (destek) setDestekler(destek.requests);

      if (errMsgs.length > 0) {
        setHata(errMsgs[0] ?? "Bazı veriler yüklenemedi.");
      }
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Veriler yüklenemedi.");
    } finally {
      setYukleniyor(false);
    }
  }, [filtreParams, tarihAralik, arama, rolFiltre, aktifFiltre, kullanimTip]);

  useEffect(() => { veriYukle(); }, []);

  useEffect(() => {
    if (!yukleniyor && (aktifSekme === "bolge" || aktifSekme === "kullanim")) {
      veriYukle();
    }
  }, [tarihAralik, kullanimTip]);

  const kurumKoduGuncelle = () => {
    setYeniKullanici((k) => ({
      ...k,
      institutionCode: kurumKoduOner(k.district, k.institutionName),
    }));
  };

  const kullaniciOlustur = async () => {
    setKayitMesaj(null);
    try {
      await api.adminKullaniciOlustur({
        ...yeniKullanici,
        institutionCode: yeniKullanici.institutionCode || kurumKoduOner(yeniKullanici.district, yeniKullanici.institutionName),
      });
      setKayitMesaj("Kullanıcı oluşturuldu.");
      setYeniKullanici({ name: "", email: "", password: "", province: "", district: "", institutionName: "", institutionCode: "", role: "hoca", isActive: true });
      veriYukle();
    } catch (e) {
      setKayitMesaj(e instanceof Error ? e.message : "Hata");
    }
  };

  const kullaniciPasif = async (u: AdminKullanici) => {
    await api.adminKullaniciGuncelle(u.id, { isActive: !u.isActive } as Partial<AdminKullanici>);
    veriYukle();
  };

  const sifreSifirla = async (u: AdminKullanici) => {
    const sifre = prompt(`${u.name} için yeni geçici şifre (min 6 karakter):`);
    if (!sifre || sifre.length < 6) return;
    await api.adminSifreSifirla(u.id, sifre);
    alert("Şifre güncellendi.");
  };

  const filtreliDestek = destekler.filter((d) => {
    if (destekFiltre === "yeni" && d.status !== "yeni") return false;
    if (destekFiltre === "cozuldu" && d.status !== "cozuldu") return false;
    if (il && d.province !== il) return false;
    if (ilce && d.district !== ilce) return false;
    return true;
  });

  const ilceSecenekleri = filtreler?.districts.filter((d) => !il || d.province === il) ?? [];
  const kurumSecenekleri = filtreler?.institutions.filter((i) => {
    if (il && i.province !== il) return false;
    if (ilce && i.district !== ilce) return false;
    return true;
  }) ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      <header style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2563eb 100%)", padding: "16px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛡️</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 }}>Yönetim Paneli</h1>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", margin: "2px 0 0" }}>Kurum / yurt takip merkezi</p>
          </div>
          <a href="/" style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", textDecoration: "none", padding: "7px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)" }}>← Uygulama</a>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px" }}>
        <FiltreSatir>
          <FiltreAlan label="İl">
            <select value={il} onChange={(e) => { setIl(e.target.value); setIlce(""); setKurum(""); }} style={inputStyle}>
              <option value="">Tümü</option>
              {filtreler?.provinces.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </FiltreAlan>
          <FiltreAlan label="İlçe">
            <select value={ilce} onChange={(e) => { setIlce(e.target.value); setKurum(""); }} style={inputStyle}>
              <option value="">Tümü</option>
              {ilceSecenekleri.map((d) => <option key={`${d.province}-${d.district}`} value={d.district}>{d.district}</option>)}
            </select>
          </FiltreAlan>
          <FiltreAlan label="Kurum">
            <select value={kurum} onChange={(e) => setKurum(e.target.value)} style={inputStyle}>
              <option value="">Tümü</option>
              {kurumSecenekleri.map((k) => (
                <option key={k.institution_code} value={k.institution_code}>{k.institution_name || k.institution_code}</option>
              ))}
            </select>
          </FiltreAlan>
          <button onClick={veriYukle} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", alignSelf: "flex-end" }}>
            Filtrele
          </button>
        </FiltreSatir>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", background: "#fff", borderRadius: 12, padding: 4, border: "1.5px solid #e2e8f0", marginBottom: 16 }}>
          {SEKMELER.map((s) => (
            <button key={s.id} onClick={() => setAktifSekme(s.id)}
              style={{ flex: "1 1 auto", padding: "8px 10px", borderRadius: 9, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                background: aktifSekme === s.id ? "linear-gradient(135deg, #1e3a5f, #2563eb)" : "transparent",
                color: aktifSekme === s.id ? "#fff" : "#64748b" }}>
              {s.simge} {s.label}
            </button>
          ))}
        </div>

        {hata && <div style={{ padding: 14, borderRadius: 12, background: "#fee2e2", color: "#991b1b", marginBottom: 12, fontWeight: 600 }}>{hata}</div>}
        {yukleniyor && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Yükleniyor...</div>}

        {!yukleniyor && !hata && aktifSekme === "genel" && overview && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <StatKart baslik="Toplam Kullanıcı" deger={overview.totalUsers} renk="#2563eb" simge="👤" />
              <StatKart baslik="Bugün Giriş Yapan" deger={overview.todayLogins} renk="#16a34a" simge="✅" />
              <StatKart baslik="Aktif Kurum (7g)" deger={overview.activeInstitutions} renk="#0d9488" simge="🏫" />
              <StatKart baslik="Pasif Kurum" deger={overview.passiveInstitutions} renk="#d97706" simge="⏸️" />
              <StatKart baslik="Destek Talebi" deger={overview.totalSupport} renk="#f59e0b" simge="💬" />
              <StatKart baslik="7 Gün Aktif Kullanıcı" deger={overview.activeUsers7d} renk="#7c3aed" simge="📈" />
            </div>

            <div style={{ background: "#eff6ff", borderRadius: 12, padding: "12px 14px", border: "1px solid #bfdbfe", fontSize: 12, color: "#1e40af" }}>
              <strong>Hazır raporlar:</strong>{" "}
              {[
                ["Bugün Kimler Girdi?", "genel"],
                ["Bölge Raporu", "bolge"],
                ["Pasif Kullanıcılar", "kullanim"],
                ["Kurum Özeti", "kurumlar"],
              ].map(([label, tab], i) => (
                <button key={i} onClick={() => setAktifSekme(tab as Sekme)}
                  style={{ marginLeft: 6, padding: "4px 10px", borderRadius: 8, border: "1px solid #93c5fd", background: "#fff", fontSize: 11, fontWeight: 700, color: "#2563eb", cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>

            <GunlukGrafik dailyLogins={overview.dailyLogins} />

            <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1.5px solid #e2e8f0" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
                Bugün Giriş Yapanlar {il || ilce ? `(${il}${ilce ? ` / ${ilce}` : ""})` : ""}
              </div>
              <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 12px" }}>
                Bugün <strong>{bugunGirisler.length}</strong> kullanıcı giriş yaptı.
              </p>
              {bugunGirisler.length === 0 ? (
                <p style={{ fontSize: 13, color: "#94a3b8" }}>Bugün giriş kaydı yok.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: "#64748b" }}>
                        <th style={{ padding: 8 }}>Saat</th><th>Ad</th><th>Kurum</th><th>İlçe</th><th>E-posta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bugunGirisler.map((u) => (
                        <tr key={u.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                          <td style={{ padding: 8 }}>{u.login_time || "—"}</td>
                          <td>{u.name}</td>
                          <td>{u.institutionName || "—"}</td>
                          <td>{u.district || "—"}</td>
                          <td>{u.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {overview.districtActivityToday.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1.5px solid #e2e8f0" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Bugün İlçe Bazlı Aktivite</div>
                {overview.districtActivityToday.map((d) => (
                  <div key={`${d.province}-${d.district}`} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12 }}>
                    <span>{d.district} ({d.province})</span>
                    <strong>{d.today_count} giriş</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!yukleniyor && !hata && aktifSekme === "bolge" && bolgeRapor && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <FiltreSatir>
              <FiltreAlan label="Tarih aralığı">
                <select value={tarihAralik} onChange={(e) => setTarihAralik(e.target.value)} style={inputStyle}>
                  <option value="today">Bugün</option>
                  <option value="7d">Son 7 gün</option>
                  <option value="30d">Son 30 gün</option>
                </select>
              </FiltreAlan>
            </FiltreSatir>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <StatKart baslik="Toplam kullanıcı" deger={bolgeRapor.summary.total_users ?? 0} renk="#2563eb" simge="👤" />
              <StatKart baslik="Aralıkta aktif" deger={bolgeRapor.summary.active_in_range ?? 0} renk="#16a34a" simge="✓" />
              <StatKart baslik="Hiç giriş yok" deger={bolgeRapor.summary.never_logged_in ?? 0} renk="#dc2626" simge="!" />
              <StatKart baslik="Aktif kurum" deger={bolgeRapor.summary.active_institutions ?? 0} renk="#0d9488" simge="🏫" />
            </div>
            <RaporTablo kullanicilar={bolgeRapor.users} />
          </div>
        )}

        {!yukleniyor && !hata && aktifSekme === "kurumlar" && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b" }}>
                  <th style={{ padding: 10 }}>Kurum</th><th>İl</th><th>İlçe</th><th>Kullanıcı</th>
                  <th>Bugün</th><th>7 gün</th><th>Son giriş</th><th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {kurumlar.map((k) => (
                  <tr key={k.institution_code} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: 10, fontWeight: 700 }}>{k.institution_name || k.institution_code}</td>
                    <td>{k.province || "—"}</td>
                    <td>{k.district || "—"}</td>
                    <td>{k.user_count}</td>
                    <td>{k.today_active}</td>
                    <td>{k.active_7d}</td>
                    <td>{formatTarih(k.last_login_at)}</td>
                    <td><DurumRozet durum={k.status === "active" ? "week" : "inactive"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {kurumlar.length === 0 && <p style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Kurum kaydı yok.</p>}
          </div>
        )}

        {!yukleniyor && !hata && aktifSekme === "kullanicilar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1.5px solid #e2e8f0" }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Yeni kullanıcı oluştur</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                <div><label style={labelStyle}>Ad Soyad</label><input style={inputStyle} value={yeniKullanici.name} onChange={(e) => setYeniKullanici({ ...yeniKullanici, name: e.target.value })} /></div>
                <div><label style={labelStyle}>E-posta</label><input style={inputStyle} value={yeniKullanici.email} onChange={(e) => setYeniKullanici({ ...yeniKullanici, email: e.target.value })} /></div>
                <div><label style={labelStyle}>Geçici şifre</label><input style={inputStyle} type="password" value={yeniKullanici.password} onChange={(e) => setYeniKullanici({ ...yeniKullanici, password: e.target.value })} /></div>
                <div><label style={labelStyle}>İl</label><input style={inputStyle} value={yeniKullanici.province} onChange={(e) => setYeniKullanici({ ...yeniKullanici, province: e.target.value })} placeholder="Antalya" /></div>
                <div><label style={labelStyle}>İlçe</label><input style={inputStyle} value={yeniKullanici.district} onChange={(e) => setYeniKullanici({ ...yeniKullanici, district: e.target.value })} onBlur={kurumKoduGuncelle} placeholder="Alanya" /></div>
                <div><label style={labelStyle}>Kurum / Yurt</label><input style={inputStyle} value={yeniKullanici.institutionName} onChange={(e) => setYeniKullanici({ ...yeniKullanici, institutionName: e.target.value })} onBlur={kurumKoduGuncelle} /></div>
                <div><label style={labelStyle}>Kurum kodu</label><input style={inputStyle} value={yeniKullanici.institutionCode} onChange={(e) => setYeniKullanici({ ...yeniKullanici, institutionCode: e.target.value })} placeholder="alanya-ferah" /></div>
                <div><label style={labelStyle}>Rol</label>
                  <select style={inputStyle} value={yeniKullanici.role} onChange={(e) => setYeniKullanici({ ...yeniKullanici, role: e.target.value as KullaniciRol })}>
                    <option value="hoca">Hoca</option>
                    <option value="kurum_mesulu">Kurum Mesulü</option>
                    <option value="admin">Yönetici</option>
                  </select>
                </div>
              </div>
              <button onClick={kullaniciOlustur} style={{ marginTop: 12, padding: "10px 18px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                Kullanıcı oluştur
              </button>
              {kayitMesaj && <p style={{ fontSize: 12, marginTop: 8, color: kayitMesaj.includes("oluşturuldu") ? "#166534" : "#991b1b" }}>{kayitMesaj}</p>}
            </div>

            <FiltreSatir>
              <FiltreAlan label="Ara"><input style={inputStyle} value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Ad, e-posta, kurum" /></FiltreAlan>
              <FiltreAlan label="Rol">
                <select style={inputStyle} value={rolFiltre} onChange={(e) => setRolFiltre(e.target.value)}>
                  <option value="">Tümü</option>
                  <option value="hoca">Hoca</option>
                  <option value="kurum_mesulu">Kurum Mesulü</option>
                </select>
              </FiltreAlan>
              <FiltreAlan label="Durum">
                <select style={inputStyle} value={aktifFiltre} onChange={(e) => setAktifFiltre(e.target.value)}>
                  <option value="">Tümü</option>
                  <option value="true">Aktif</option>
                  <option value="false">Pasif</option>
                </select>
              </FiltreAlan>
              <button onClick={veriYukle} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Uygula</button>
            </FiltreSatir>

            <RaporTablo kullanicilar={kullanicilar} onPasif={kullaniciPasif} onSifre={sifreSifirla} showActions />
          </div>
        )}

        {!yukleniyor && !hata && aktifSekme === "kullanim" && (
          <div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {[
                { id: "never", label: "Hiç giriş yok" },
                { id: "inactive7", label: "7+ gün pasif" },
                { id: "inactive30", label: "30+ gün pasif" },
                { id: "inactiveInstitutions", label: "Pasif yurtlar" },
              ].map((t) => (
                <button key={t.id} onClick={() => setKullanimTip(t.id)}
                  style={{ padding: "8px 12px", borderRadius: 10, border: kullanimTip === t.id ? "none" : "1.5px solid #e2e8f0",
                    background: kullanimTip === t.id ? "#2563eb" : "#fff", color: kullanimTip === t.id ? "#fff" : "#64748b", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  {t.label}
                </button>
              ))}
            </div>
            {kullanimTip === "inactiveInstitutions" ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1.5px solid #e2e8f0" }}>
                {(pasifKurumlar as { institution_name?: string; institution_code?: string; user_count?: number }[]).map((k) => (
                  <div key={k.institution_code} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                    <strong>{k.institution_name || k.institution_code}</strong> — {k.user_count} kullanıcı, son 7 günde aktif yok
                  </div>
                ))}
                {pasifKurumlar.length === 0 && <p style={{ color: "#94a3b8" }}>Pasif yurt bulunamadı.</p>}
              </div>
            ) : (
              <RaporTablo kullanicilar={kullanimListe} onPasif={kullaniciPasif} onSifre={sifreSifirla} onHatirlat showActions showDays />
            )}
          </div>
        )}

        {!yukleniyor && !hata && aktifSekme === "destek" && (
          <div>
            <FiltreSatir>
              <FiltreAlan label="Durum">
                <select style={inputStyle} value={destekFiltre} onChange={(e) => setDestekFiltre(e.target.value)}>
                  <option value="">Tümü</option>
                  <option value="yeni">Yeni</option>
                  <option value="cozuldu">Çözüldü</option>
                </select>
              </FiltreAlan>
            </FiltreSatir>
            {filtreliDestek.map((m) => (
              <div key={m.id} style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1.5px solid #e2e8f0", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{m.userName || "İsimsiz"}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{m.userEmail} · {m.institution_name || "Kurum bilinmiyor"}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{m.district}, {m.province}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: m.status === "cozuldu" ? "#dcfce7" : "#fef9c3", color: m.status === "cozuldu" ? "#166534" : "#854d0e" }}>
                      {m.status === "cozuldu" ? "Çözüldü" : m.status === "inceleniyor" ? "İnceleniyor" : "Yeni"}
                    </span>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>{formatTarih(m.createdAt)}</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.6, background: "#f8fafc", padding: 12, borderRadius: 8, margin: 0 }}>{m.message}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => api.adminDestekGuncelle(m.id, { status: "inceleniyor" }).then(veriYukle)}
                    style={{ fontSize: 11, fontWeight: 700, padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}>İnceleniyor</button>
                  <button onClick={() => api.adminDestekGuncelle(m.id, { status: "cozuldu" }).then(veriYukle)}
                    style={{ fontSize: 11, fontWeight: 700, padding: "6px 10px", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", cursor: "pointer" }}>Çözüldü</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RaporTablo({
  kullanicilar,
  onPasif,
  onSifre,
  onHatirlat,
  showActions,
  showDays,
}: {
  kullanicilar: AdminKullanici[];
  onPasif?: (u: AdminKullanici) => void;
  onSifre?: (u: AdminKullanici) => void;
  onHatirlat?: boolean;
  showActions?: boolean;
  showDays?: boolean;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b" }}>
            <th style={{ padding: 10 }}>Ad</th><th>Kurum</th><th>İlçe</th><th>İl</th><th>Rol</th>
            <th>Son giriş</th>{showDays && <th>Gün</th>}<th>Durum</th>
            {showActions && <th>İşlem</th>}
          </tr>
        </thead>
        <tbody>
          {kullanicilar.map((u) => (
            <tr key={u.id} style={{ borderTop: "1px solid #f1f5f9" }}>
              <td style={{ padding: 10 }}>
                <div style={{ fontWeight: 700 }}>{u.name}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>{u.email}</div>
              </td>
              <td>{u.institutionName || "—"}</td>
              <td>{u.district || "—"}</td>
              <td>{u.province || "—"}</td>
              <td>{ROL_LABEL[u.role] || u.role}</td>
              <td>{formatTarih(u.lastLoginAt)}</td>
              {showDays && <td>{u.daysSinceLogin ?? "—"}</td>}
              <td>{u.activityStatus && <DurumRozet durum={u.activityStatus} />}</td>
              {showActions && (
                <td style={{ padding: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {onPasif && (
                      <button onClick={() => onPasif(u)} style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}>
                        {u.isActive ? "Pasif yap" : "Aktif yap"}
                      </button>
                    )}
                    {onSifre && (
                      <button onClick={() => onSifre(u)} style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}>Şifre sıfırla</button>
                    )}
                    {onHatirlat && (
                      <button onClick={() => navigator.clipboard.writeText(hatirlatmaMesaji(u.name))}
                        style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6, border: "none", background: "#eff6ff", color: "#2563eb", cursor: "pointer" }}>
                        Hatırlatma kopyala
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {kullanicilar.length === 0 && <p style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Kayıt yok.</p>}
    </div>
  );
}
