import { useState, useEffect, useCallback } from "react";
import {
  api,
  type AdminKullanici,
  type AdminDestek,
  type AdminDashboard,
  type AdminMintikaMetrik,
  type AdminYurtMetrik,
  type AdminVeriSagligi,
  type AdminAktiviteResponse,
} from "../lib/api";
import { TRACKED_DISTRICTS } from "../lib/admin/trackedDistricts";
import { hatirlatmaMesaji, yurtHatirlatmaMesaji } from "../lib/admin/adminHatirlatma";
import { ROL_LABEL, normalizeRole } from "../lib/admin/adminRol";
import { indirAdminExcel } from "../lib/admin/adminExcel";
import { AdminKullaniciForm } from "./admin/AdminKullaniciForm";
import {
  StatKart,
  DurumRozet,
  YurtDurumRozet,
  formatTarih,
  inputStyle,
  selectStyle,
  FiltreSatir,
  FiltreAlan,
} from "./admin/adminUi";

type Sekme =
  | "genel"
  | "mintika"
  | "yurt"
  | "kullanicilar"
  | "aktivite"
  | "veri"
  | "destek"
  | "excel";

const SEKMELER: { id: Sekme; label: string; simge: string }[] = [
  { id: "genel", label: "Genel Bakış", simge: "📊" },
  { id: "mintika", label: "Mıntıka Panosu", simge: "🗺️" },
  { id: "yurt", label: "Yurt Takibi", simge: "🏫" },
  { id: "kullanicilar", label: "Kullanıcılar", simge: "👥" },
  { id: "aktivite", label: "Aktivite Takibi", simge: "📋" },
  { id: "veri", label: "Veri Sağlığı", simge: "🩺" },
  { id: "destek", label: "Destek", simge: "💬" },
  { id: "excel", label: "Excel Raporları", simge: "📥" },
];

const TARIH_SECENEKLERI = [
  { v: "today", l: "Bugün" },
  { v: "yesterday", l: "Dün" },
  { v: "7d", l: "Son 7 gün" },
  { v: "30d", l: "Son 30 gün" },
  { v: "this_month", l: "Bu ay" },
  { v: "last_month", l: "Geçen ay" },
  { v: "period", l: "Bu dönem" },
  { v: "season", l: "Bu sezon" },
  { v: "custom", l: "Özel aralık" },
];

export default function AdminSayfasi() {
  const [aktifSekme, setAktifSekme] = useState<Sekme>("genel");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);

  const [mintika, setMintika] = useState("");
  const [kurum, setKurum] = useState("");
  const [tarihAralik, setTarihAralik] = useState("7d");
  const [ozelBaslangic, setOzelBaslangic] = useState("");
  const [ozelBitis, setOzelBitis] = useState("");
  const [yurtPreset, setYurtPreset] = useState("");

  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [mintikalar, setMintikalar] = useState<AdminMintikaMetrik[]>([]);
  const [yurts, setYurts] = useState<AdminYurtMetrik[]>([]);
  const [veriSagligi, setVeriSagligi] = useState<AdminVeriSagligi | null>(null);
  const [aktivite, setAktivite] = useState<AdminAktiviteResponse | null>(null);
  const [bugunGirisler, setBugunGirisler] = useState<AdminKullanici[]>([]);
  const [kullanicilar, setKullanicilar] = useState<AdminKullanici[]>([]);
  const [destekler, setDestekler] = useState<AdminDestek[]>([]);

  const [arama, setArama] = useState("");
  const [rolFiltre, setRolFiltre] = useState("");
  const [aktifFiltre, setAktifFiltre] = useState("");
  const [destekFiltre, setDestekFiltre] = useState("");
  const [aktiviteAction, setAktiviteAction] = useState("");
  const [donemBaslangic, setDonemBaslangic] = useState("");
  const [donemBitis, setDonemBitis] = useState("");
  const [sezonBaslangic, setSezonBaslangic] = useState("");
  const [sezonBitis, setSezonBitis] = useState("");

  const filtreParams = useCallback(
    () => ({
      district: mintika || undefined,
      institutionCode: kurum || undefined,
      range: tarihAralik,
      from: tarihAralik === "custom" ? ozelBaslangic || undefined : undefined,
      to: tarihAralik === "custom" ? ozelBitis || undefined : undefined,
      preset: yurtPreset || undefined,
    }),
    [mintika, kurum, tarihAralik, ozelBaslangic, ozelBitis, yurtPreset],
  );

  const filtreMetni = () => {
    const p = [mintika && `Mıntıka: ${mintika}`, kurum && `Kurum kodu: ${kurum}`, `Aralık: ${tarihAralik}`].filter(Boolean);
    return p.join(" · ") || "Tüm kayıtlar";
  };

  const veriYukle = useCallback(async () => {
    setYukleniyor(true);
    setHata(null);
    const fp = filtreParams();
    try {
      const jobs: Promise<void>[] = [
        api.adminDashboard(fp).then(setDashboard),
        api.adminBugunGirisler(fp).then((r) => setBugunGirisler(r.logins)),
        api.adminKullanicilar({
          district: fp.district,
          institutionCode: fp.institutionCode,
          search: arama || undefined,
          role: rolFiltre || undefined,
          active: aktifFiltre || undefined,
        }).then((r) => setKullanicilar(r.users)),
        api.adminDestek().then((r) => setDestekler(r.requests)),
      ];

      if (aktifSekme === "mintika" || aktifSekme === "genel" || aktifSekme === "excel") {
        jobs.push(api.adminMintikaBoard(fp).then((r) => setMintikalar(r.mintikalar)));
      }
      if (aktifSekme === "yurt" || aktifSekme === "genel" || aktifSekme === "excel") {
        jobs.push(api.adminYurtTakibi(fp).then((r) => setYurts(r.yurts)));
      }
      if (aktifSekme === "veri" || aktifSekme === "excel") {
        jobs.push(api.adminVeriSagligi().then(setVeriSagligi));
      }
      if (aktifSekme === "aktivite") {
        jobs.push(
          api
            .adminAktivite({ ...fp, action: aktiviteAction || undefined })
            .then(setAktivite),
        );
      }

      const settingsRes = await api.adminSettings().catch(() => null);
      if (settingsRes?.settings) {
        setDonemBaslangic(settingsRes.settings.periodStart?.slice(0, 10) ?? "");
        setDonemBitis(settingsRes.settings.periodEnd?.slice(0, 10) ?? "");
        setSezonBaslangic(settingsRes.settings.seasonStart?.slice(0, 10) ?? "");
        setSezonBitis(settingsRes.settings.seasonEnd?.slice(0, 10) ?? "");
      }

      await Promise.allSettled(jobs);
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Veriler yüklenemedi.");
    } finally {
      setYukleniyor(false);
    }
  }, [filtreParams, arama, rolFiltre, aktifFiltre, aktifSekme, aktiviteAction]);

  useEffect(() => {
    veriYukle();
  }, []);

  useEffect(() => {
    if (!yukleniyor) veriYukle();
  }, [aktifSekme, tarihAralik, yurtPreset, aktiviteAction]);

  const kullaniciPasif = async (u: AdminKullanici) => {
    await api.adminKullaniciGuncelle(u.id, { isActive: !u.isActive } as Partial<AdminKullanici>);
    veriYukle();
  };

  const sifreSifirla = async (u: AdminKullanici) => {
    try {
      const r = await api.adminSifreSifirla(u.id, { generate: true });
      alert(`Yeni geçici şifre: ${r.password ?? "—"}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Şifre sıfırlanamadı.");
    }
  };

  const kurumSec = (code: string, district?: string) => {
    if (district) setMintika(district);
    setKurum(code);
    setAktifSekme("kullanicilar");
  };

  const kurumSecenekleri = [...new Map(yurts.map((y) => [y.institutionCode, y])).values()];

  const filtreliDestek = destekler.filter((d) => {
    if (destekFiltre && d.status !== destekFiltre) return false;
    if (mintika && d.district !== mintika) return false;
    if (kurum && d.institution_code !== kurum) return false;
    return true;
  });

  const excelIndir = async (tip: "genel" | "mintika" | "yurt" | "veri") => {
    const ozet = dashboard?.summary ?? {};
    await indirAdminExcel({
      raporAdi: tip === "genel" ? "Genel Bakış" : tip === "mintika" ? "Mıntıka Panosu" : tip === "yurt" ? "Yurt Takibi" : "Veri Sağlığı",
      rangeLabel: dashboard?.range.label ?? tarihAralik,
      filtreler: filtreMetni(),
      ozet: {
        "Toplam yurt": ozet.totalYurts ?? yurts.length,
        "Toplam kullanıcı": ozet.totalUsers ?? 0,
        "Bugün aktif yurt": ozet.todayActiveYurts ?? 0,
        "7+ gün pasif yurt": ozet.passive7dYurts ?? 0,
        "Açık destek": ozet.openSupport ?? 0,
      },
      mintikalar: tip !== "yurt" ? mintikalar : undefined,
      yurts: tip !== "mintika" ? yurts : undefined,
      issues: tip === "veri" ? veriSagligi?.issues : undefined,
    });
  };

  const mevcutEpostalar = kullanicilar.map((u) => u.email.toLowerCase());

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      <header style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2563eb 100%)", padding: "16px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🛡️</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 }}>Yönetim Paneli</h1>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", margin: "2px 0 0" }}>Mıntıka / yurt takip merkezi</p>
          </div>
          <a href="/" style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", textDecoration: "none", padding: "7px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)" }}>← Uygulama</a>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px" }}>
        <FiltreSatir>
          <FiltreAlan label="Mıntıka">
            <select value={mintika} onChange={(e) => { setMintika(e.target.value); setKurum(""); }} style={selectStyle}>
              <option value="">Tümü</option>
              {TRACKED_DISTRICTS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </FiltreAlan>
          <FiltreAlan label="Yurt / Kurum">
            <select value={kurum} onChange={(e) => setKurum(e.target.value)} style={selectStyle}>
              <option value="">Tümü</option>
              {kurumSecenekleri.map((y) => (
                <option key={y.institutionCode} value={y.institutionCode}>{y.institutionName}</option>
              ))}
            </select>
          </FiltreAlan>
          <FiltreAlan label="Tarih aralığı">
            <select value={tarihAralik} onChange={(e) => setTarihAralik(e.target.value)} style={selectStyle}>
              {TARIH_SECENEKLERI.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </FiltreAlan>
          {tarihAralik === "custom" && (
            <>
              <FiltreAlan label="Başlangıç">
                <input type="date" value={ozelBaslangic} onChange={(e) => setOzelBaslangic(e.target.value)} style={inputStyle} />
              </FiltreAlan>
              <FiltreAlan label="Bitiş">
                <input type="date" value={ozelBitis} onChange={(e) => setOzelBitis(e.target.value)} style={inputStyle} />
              </FiltreAlan>
            </>
          )}
          <button type="button" onClick={veriYukle} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", alignSelf: "flex-end" }}>
            Uygula
          </button>
        </FiltreSatir>

        {(dashboard?.range.warning || dashboard?.activityWarning) && (
          <div style={{ padding: 12, borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", fontSize: 12, marginBottom: 12 }}>
            {dashboard.range.warning || dashboard.activityWarning}
          </div>
        )}
        {dashboard?.dataQualityWarning && (
          <div style={{ padding: 12, borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 12, marginBottom: 12 }}>
            {dashboard.dataQualityWarning}
          </div>
        )}

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", background: "#fff", borderRadius: 12, padding: 4, border: "1.5px solid #e2e8f0", marginBottom: 16 }}>
          {SEKMELER.map((s) => (
            <button key={s.id} type="button" onClick={() => setAktifSekme(s.id)}
              style={{ flex: "1 1 auto", minWidth: 100, padding: "8px 8px", borderRadius: 9, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer",
                background: aktifSekme === s.id ? "linear-gradient(135deg, #1e3a5f, #2563eb)" : "transparent",
                color: aktifSekme === s.id ? "#fff" : "#64748b" }}>
              {s.simge} {s.label}
            </button>
          ))}
        </div>

        {hata && <div style={{ padding: 14, borderRadius: 12, background: "#fee2e2", color: "#991b1b", marginBottom: 12, fontWeight: 600 }}>{hata}</div>}
        {yukleniyor && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Yükleniyor...</div>}

        {!yukleniyor && aktifSekme === "genel" && dashboard && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <StatKart baslik="Toplam mıntıka" deger={dashboard.summary.totalDistricts} renk="#1e3a5f" simge="🗺️" />
              <StatKart baslik="Toplam yurt" deger={dashboard.summary.totalYurts} renk="#2563eb" simge="🏫" />
              <StatKart baslik="Toplam kullanıcı" deger={dashboard.summary.totalUsers} renk="#7c3aed" simge="👤" />
              <StatKart baslik="Bugün aktif yurt" deger={dashboard.summary.todayActiveYurts} renk="#16a34a" simge="✅" />
              <StatKart baslik="7+ gün pasif yurt" deger={dashboard.summary.passive7dYurts} renk="#d97706" simge="⏸️" />
              <StatKart baslik="Hiç giriş yok" deger={dashboard.summary.neverLoginYurts} renk="#dc2626" simge="⛔" />
              <StatKart baslik="Açık destek" deger={dashboard.summary.openSupport} renk="#f59e0b" simge="💬" />
              <StatKart baslik="Veri sorunu" deger={dashboard.summary.dataIssueCount} renk="#64748b" simge="🩺" />
            </div>

            <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1.5px solid #e2e8f0" }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Mıntıka durum özeti</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ color: "#64748b", textAlign: "left" }}>
                      <th style={{ padding: 8 }}>Mıntıka</th><th>Yurt</th><th>Bugün aktif</th><th>7g aktif</th><th>7g+ pasif</th><th>Hiç giriş</th><th>Sağlık</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.mintikaSummary.map((m) => (
                      <tr key={m.districtName} style={{ borderTop: "1px solid #f1f5f9", cursor: "pointer" }} onClick={() => { setMintika(m.districtName); setAktifSekme("mintika"); }}>
                        <td style={{ padding: 8, fontWeight: 700 }}>{m.districtName}</td>
                        <td>{m.totalYurts}</td>
                        <td>{m.todayActiveYurts}</td>
                        <td>{m.active7dYurts}</td>
                        <td>{m.passive7dYurts}</td>
                        <td>{m.neverLoginYurts}</td>
                        <td>{m.healthScore ?? "—"} ({m.healthLabel})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {dashboard.attentionYurts.length > 0 && (
              <div style={{ background: "#fff7ed", borderRadius: 14, padding: 16, border: "1px solid #fed7aa" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#9a3412", marginBottom: 8 }}>Dikkat gerektiren yurtlar</div>
                {dashboard.attentionYurts.map((y) => (
                  <div key={y.institutionCode} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", fontSize: 12, borderBottom: "1px solid #ffedd5" }}>
                    <span><strong>{y.institutionName}</strong> · {y.districtName}</span>
                    <YurtDurumRozet durum={y.activityStatus} />
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1.5px solid #e2e8f0" }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Bugün giriş yapanlar</div>
              {bugunGirisler.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 13 }}>Veri yok</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead><tr style={{ color: "#64748b" }}><th style={{ padding: 6 }}>Saat</th><th>Kullanıcı</th><th>Yurt</th><th>Mıntıka</th></tr></thead>
                  <tbody>
                    {bugunGirisler.map((u) => (
                      <tr key={u.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td style={{ padding: 6 }}>{u.login_time || "—"}</td>
                        <td>{u.name}</td>
                        <td>{u.institutionName || "—"}</td>
                        <td>{u.district || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {!yukleniyor && aktifSekme === "mintika" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mintikalar.length === 0 ? <p style={{ color: "#94a3b8" }}>Veri yok</p> : mintikalar.map((m) => (
              <div key={m.districtName} style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1.5px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{m.districtName}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Son hareket: {formatTarih(m.lastMovementAt)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: m.healthScore != null && m.healthScore >= 80 ? "#16a34a" : m.healthScore != null && m.healthScore >= 50 ? "#d97706" : "#dc2626" }}>
                      {m.healthScore ?? "—"}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{m.healthLabel}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, fontSize: 11 }}>
                  <span>Yurt: <strong>{m.totalYurts}</strong></span>
                  <span>Kullanıcı: <strong>{m.totalUsers}</strong></span>
                  <span>Bugün aktif yurt: <strong>{m.todayActiveYurts}</strong></span>
                  <span>7g aktif: <strong>{m.active7dYurts}</strong></span>
                  <span>7g+ pasif: <strong>{m.passive7dYurts}</strong></span>
                  <span>Hiç giriş: <strong>{m.neverLoginYurts}</strong></span>
                  <span>Kullanım: <strong>{m.usageRate != null ? `${m.usageRate}%` : "—"}</strong></span>
                </div>
                <button type="button" onClick={() => { setMintika(m.districtName); setAktifSekme("yurt"); veriYukle(); }}
                  style={{ marginTop: 10, fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer" }}>
                  Yurtları listele
                </button>
              </div>
            ))}
          </div>
        )}

        {!yukleniyor && aktifSekme === "yurt" && (
          <div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {[
                { id: "", label: "Tümü" },
                { id: "today_active", label: "Bugün aktif" },
                { id: "week_active", label: "Bu hafta aktif" },
                { id: "passive7", label: "7 gün pasif" },
                { id: "passive30", label: "30 gün pasif" },
                { id: "never", label: "Hiç giriş yok" },
              ].map((p) => (
                <button key={p.id} type="button" onClick={() => setYurtPreset(p.id)}
                  style={{ padding: "6px 10px", borderRadius: 8, border: yurtPreset === p.id ? "none" : "1px solid #e2e8f0", background: yurtPreset === p.id ? "#2563eb" : "#fff", color: yurtPreset === p.id ? "#fff" : "#64748b", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", color: "#64748b", textAlign: "left" }}>
                    <th style={{ padding: 10 }}>Yurt</th><th>Mıntıka</th><th>Kullanıcı</th><th>Bugün</th><th>7g</th><th>PNG</th><th>PDF</th><th>WA</th><th>Son giriş</th><th>Durum</th><th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {yurts.map((y) => (
                    <tr key={y.institutionCode} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ padding: 10, fontWeight: 700 }}>{y.institutionName}{!y.inRegistry && <span style={{ marginLeft: 4, fontSize: 9, color: "#b45309" }}>kayıtsız</span>}</td>
                      <td>{y.districtName}</td>
                      <td>{y.userCount}</td>
                      <td>{y.todayLoginUsers}</td>
                      <td>{y.logins7d}</td>
                      <td>{y.exportPng ?? 0}</td>
                      <td>{y.exportPdf ?? 0}</td>
                      <td>{y.shareWhatsapp ?? 0}</td>
                      <td>{formatTarih(y.lastLoginAt)}</td>
                      <td><YurtDurumRozet durum={y.activityStatus} /></td>
                      <td style={{ padding: 8 }}>
                        <button type="button" onClick={() => kurumSec(y.institutionCode, y.districtName)} style={{ fontSize: 10, marginRight: 4, cursor: "pointer" }}>Kullanıcılar</button>
                        <button type="button" onClick={() => navigator.clipboard.writeText(yurtHatirlatmaMesaji({ institutionName: y.institutionName }))} style={{ fontSize: 10, cursor: "pointer" }}>Hatırlatma</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {yurts.length === 0 && <p style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Veri yok</p>}
            </div>
          </div>
        )}

        {!yukleniyor && aktifSekme === "kullanicilar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AdminKullaniciForm mevcutEpostalar={mevcutEpostalar} onOlusturuldu={veriYukle} />
            <FiltreSatir>
              <FiltreAlan label="Ara"><input style={inputStyle} value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Ad, e-posta" /></FiltreAlan>
              <FiltreAlan label="Rol">
                <select style={selectStyle} value={rolFiltre} onChange={(e) => setRolFiltre(e.target.value)}>
                  <option value="">Tümü</option><option value="user">Kullanıcı</option><option value="admin">Admin</option>
                </select>
              </FiltreAlan>
              <button type="button" onClick={veriYukle} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Uygula</button>
            </FiltreSatir>
            <RaporTablo kullanicilar={kullanicilar} onPasif={kullaniciPasif} onSifre={sifreSifirla} showActions showRol />
          </div>
        )}

        {!yukleniyor && aktifSekme === "aktivite" && (
          <div>
            <FiltreSatir>
              <FiltreAlan label="İşlem">
                <select style={selectStyle} value={aktiviteAction} onChange={(e) => setAktiviteAction(e.target.value)}>
                  <option value="">Tümü</option>
                  <option value="login">login</option>
                </select>
              </FiltreAlan>
            </FiltreSatir>
            {aktivite?.warning && <p style={{ fontSize: 12, color: "#b45309", marginBottom: 8 }}>{aktivite.warning}</p>}
            {aktivite && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                <StatKart baslik="Giriş" deger={aktivite.summary.loginCount} renk="#2563eb" simge="🔑" />
                <StatKart baslik="Aktif yurt" deger={aktivite.summary.activeYurts} renk="#16a34a" simge="🏫" />
                <StatKart baslik="PNG" deger={aktivite.hasActivityLogs ? aktivite.summary.exportPng : "—"} renk="#64748b" simge="🖼️" altMetin={!aktivite.hasActivityLogs ? "Kayıt yok" : undefined} />
              </div>
            )}
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead><tr style={{ color: "#64748b" }}><th style={{ padding: 8 }}>Tarih</th><th>Kullanıcı</th><th>Yurt</th><th>Mıntıka</th><th>İşlem</th></tr></thead>
                <tbody>
                  {(aktivite?.logs ?? []).map((l) => (
                    <tr key={l.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ padding: 8 }}>{formatTarih(l.createdAt)}</td>
                      <td>{l.userName || "—"}</td>
                      <td>{l.institutionName || l.institutionCode || "—"}</td>
                      <td>{l.district || "—"}</td>
                      <td>{l.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!aktivite?.logs || aktivite.logs.length === 0) && <p style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Veri yok</p>}
            </div>
          </div>
        )}

        {!yukleniyor && aktifSekme === "veri" && veriSagligi && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const r = await api.adminReconcile();
                    alert(
                      `Eşleştirme tamamlandı.\nBağlanan: ${r.linked}\nYeni kurum: ${r.institutionsCreated}\nAtlanan: ${r.skipped}\nEşleşmeyen: ${r.unmatched.length}`,
                    );
                    veriYukle();
                  } catch (e) {
                    alert(e instanceof Error ? e.message : "Eşleştirme başarısız");
                  }
                }}
                style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
              >
                Kullanıcıları kurumlara eşleştir (onarım)
              </button>
              <p style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                Mevcut kullanıcıları institutionCode ve institutionId ile kurum envanterine bağlar.
              </p>
            </div>
            <StatKart baslik="Veri sağlığı puanı" deger={veriSagligi.score ?? "—"} renk="#0d9488" simge="🩺" altMetin={`${veriSagligi.issueCount} sorun`} />
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", marginTop: 12, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead><tr style={{ color: "#64748b" }}><th style={{ padding: 8 }}>Tür</th><th>Kayıt</th><th>Açıklama</th><th>Öneri</th></tr></thead>
                <tbody>
                  {veriSagligi.issues.map((i, idx) => (
                    <tr key={idx} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ padding: 8 }}>{i.type}</td>
                      <td>{i.record}</td>
                      <td>{i.description}</td>
                      <td>{i.suggestion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {veriSagligi.issues.length === 0 && <p style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Kritik sorun yok</p>}
            </div>
          </div>
        )}

        {!yukleniyor && aktifSekme === "destek" && (
          <div>
            <FiltreSatir>
              <FiltreAlan label="Durum">
                <select style={selectStyle} value={destekFiltre} onChange={(e) => setDestekFiltre(e.target.value)}>
                  <option value="">Tümü</option>
                  <option value="yeni">Yeni</option>
                  <option value="inceleniyor">İnceleniyor</option>
                  <option value="cozuldu">Çözüldü</option>
                </select>
              </FiltreAlan>
            </FiltreSatir>
            {filtreliDestek.length === 0 && <p style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Veri yok</p>}
            {filtreliDestek.map((m) => (
              <div key={m.id} style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1.5px solid #e2e8f0", marginBottom: 12 }}>
                <div style={{ fontWeight: 800 }}>{m.userName || "İsimsiz"}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{m.institution_name || "—"} · {m.district || "—"} · {formatTarih(m.createdAt)}</div>
                <p style={{ fontSize: 13, marginTop: 8 }}>{m.message}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button type="button" onClick={() => api.adminDestekGuncelle(m.id, { status: "inceleniyor" }).then(veriYukle)} style={{ fontSize: 11, padding: "6px 10px", cursor: "pointer" }}>İnceleniyor</button>
                  <button type="button" onClick={() => api.adminDestekGuncelle(m.id, { status: "cozuldu" }).then(veriYukle)} style={{ fontSize: 11, padding: "6px 10px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Çözüldü</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!yukleniyor && aktifSekme === "excel" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1.5px solid #e2e8f0", marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Dönem / sezon tarihleri</div>
              <FiltreSatir>
                <FiltreAlan label="Dönem başlangıç"><input type="date" value={donemBaslangic} onChange={(e) => setDonemBaslangic(e.target.value)} style={inputStyle} /></FiltreAlan>
                <FiltreAlan label="Dönem bitiş"><input type="date" value={donemBitis} onChange={(e) => setDonemBitis(e.target.value)} style={inputStyle} /></FiltreAlan>
                <FiltreAlan label="Sezon başlangıç"><input type="date" value={sezonBaslangic} onChange={(e) => setSezonBaslangic(e.target.value)} style={inputStyle} /></FiltreAlan>
                <FiltreAlan label="Sezon bitiş"><input type="date" value={sezonBitis} onChange={(e) => setSezonBitis(e.target.value)} style={inputStyle} /></FiltreAlan>
                <button type="button" onClick={() => api.adminSettingsKaydet({ periodStart: donemBaslangic, periodEnd: donemBitis, seasonStart: sezonBaslangic, seasonEnd: sezonBitis }).then(() => alert("Kaydedildi"))}
                  style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  Kaydet
                </button>
              </FiltreSatir>
            </div>
            <p style={{ fontSize: 13, color: "#64748b" }}>Renkli .xlsx raporları — gerçek kayıtlara dayanır.</p>
            {(["genel", "mintika", "yurt", "veri"] as const).map((t) => (
              <button key={t} type="button" onClick={() => excelIndir(t)}
                style={{ padding: 12, borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                📥 {t === "genel" ? "Genel Bakış" : t === "mintika" ? "Mıntıka Panosu" : t === "yurt" ? "Yurt Takibi" : "Veri Sağlığı"} Excel indir
              </button>
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
  showActions,
  showRol,
}: {
  kullanicilar: AdminKullanici[];
  onPasif?: (u: AdminKullanici) => void;
  onSifre?: (u: AdminKullanici) => void;
  showActions?: boolean;
  showRol?: boolean;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b" }}>
            <th style={{ padding: 10 }}>Ad</th><th>Yurt</th><th>Mıntıka</th>
            {showRol && <th>Rol</th>}
            <th>Son giriş</th><th>Durum</th>
            {showActions && <th>İşlem</th>}
          </tr>
        </thead>
        <tbody>
          {kullanicilar.map((u) => (
            <tr key={u.id} style={{ borderTop: "1px solid #f1f5f9" }}>
              <td style={{ padding: 10 }}>
                <div style={{ fontWeight: 700 }}>{u.name}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>{u.email}</div>
                {!u.institutionCode && <span style={{ fontSize: 9, color: "#b45309", fontWeight: 700 }}>Yurt eşleşmemiş</span>}
              </td>
              <td>{u.institutionName || "—"}</td>
              <td>{u.district || "—"}</td>
              {showRol && <td>{ROL_LABEL[normalizeRole(u.role, u.isAdmin)]}</td>}
              <td>{formatTarih(u.lastLoginAt)}</td>
              <td>{u.activityStatus && <DurumRozet durum={u.activityStatus} />}</td>
              {showActions && (
                <td style={{ padding: 8 }}>
                  {onPasif && <button type="button" onClick={() => onPasif(u)} style={{ fontSize: 10, display: "block", marginBottom: 4, cursor: "pointer" }}>{u.isActive ? "Pasif" : "Aktif"}</button>}
                  {onSifre && <button type="button" onClick={() => onSifre(u)} style={{ fontSize: 10, cursor: "pointer" }}>Şifre sıfırla</button>}
                  <button type="button" onClick={() => navigator.clipboard.writeText(hatirlatmaMesaji(u))} style={{ fontSize: 10, display: "block", marginTop: 4, cursor: "pointer" }}>Hatırlatma</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {kullanicilar.length === 0 && <p style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Veri yok</p>}
    </div>
  );
}
