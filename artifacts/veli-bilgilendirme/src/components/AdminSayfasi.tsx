import { useState, useEffect, useCallback, useMemo } from "react";
import {
  api,
  type AdminKullanici,
  type AdminDestek,
  type AdminDashboard,
  type AdminMintikaMetrik,
  type AdminYurtMetrik,
  type AdminVeriSagligi,
  type AdminAktiviteResponse,
  type AdminAktiviteLog,
  type AdminImportCommitResponse,
  type AdminYurtKayit,
} from "../lib/api";
import { TRACKED_DISTRICTS } from "../lib/admin/trackedDistricts";
import { hatirlatmaMesaji, yurtHatirlatmaMesaji } from "../lib/admin/adminHatirlatma";
import { ROL_LABEL, normalizeRole } from "../lib/admin/adminRol";
import { indirAdminExcel } from "../lib/admin/adminExcel";
import { excelKurumImportOku, type KurumImportSatiri } from "../lib/admin/adminExcelImport";
import { AppBrand } from "./AppBrand";
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
  const [kurumKayitlari, setKurumKayitlari] = useState<AdminYurtKayit[]>([]);
  const [veriSagligi, setVeriSagligi] = useState<AdminVeriSagligi | null>(null);
  const [aktivite, setAktivite] = useState<AdminAktiviteResponse | null>(null);
  const [girisLoglari, setGirisLoglari] = useState<AdminAktiviteLog[]>([]);
  const [kullanicilar, setKullanicilar] = useState<AdminKullanici[]>([]);
  const [kullaniciListeHata, setKullaniciListeHata] = useState<string | null>(null);
  const [kullaniciListeOzet, setKullaniciListeOzet] = useState<{ rawCount: number; filteredCount: number } | null>(null);
  const [destekler, setDestekler] = useState<AdminDestek[]>([]);

  const [arama, setArama] = useState("");
  const [rolFiltre, setRolFiltre] = useState("");
  /** Kullanıcılar sekmesi: "" = tümü, active, inactive (varsayılan aktif = Genel Bakış ile uyumlu) */
  const [aktifFiltre, setAktifFiltre] = useState("active");
  const [kullaniciMintika, setKullaniciMintika] = useState("");
  const [kullaniciKurum, setKullaniciKurum] = useState("");
  const [destekFiltre, setDestekFiltre] = useState("");
  const [aktiviteAction, setAktiviteAction] = useState("");
  const [donemBaslangic, setDonemBaslangic] = useState("");
  const [donemBitis, setDonemBitis] = useState("");
  const [sezonBaslangic, setSezonBaslangic] = useState("");
  const [sezonBitis, setSezonBitis] = useState("");
  const [silinecekKullanici, setSilinecekKullanici] = useState<AdminKullanici | null>(null);
  const [importRows, setImportRows] = useState<KurumImportSatiri[]>([]);
  const [importYukleniyor, setImportYukleniyor] = useState(false);
  const [importKullaniciOlustur, setImportKullaniciOlustur] = useState(true);
  const [importSifre, setImportSifre] = useState("Nehari2026");
  const [importSonuc, setImportSonuc] = useState<AdminImportCommitResponse | null>(null);
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
        api.adminYurtKayitlari().then((r) => setKurumKayitlari(r.institutions)),
        api
          .adminKullanicilar({
            district: kullaniciMintika || undefined,
            institutionCode: kullaniciKurum || undefined,
            search: arama || undefined,
            role: rolFiltre || undefined,
            active: aktifFiltre === "active" || aktifFiltre === "inactive" ? aktifFiltre : "all",
          })
          .then((r) => {
            setKullanicilar(r.users);
            setKullaniciListeHata(r.loadError);
            setKullaniciListeOzet({ rawCount: r.rawCount, filteredCount: r.filteredCount });
          }),
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
      if (aktifSekme === "aktivite" || aktifSekme === "excel") {
        jobs.push(
          api
            .adminAktivite({ ...fp, action: aktiviteAction || undefined })
            .then(setAktivite),
        );
      }
      if (aktifSekme === "genel" || aktifSekme === "mintika" || aktifSekme === "excel") {
        jobs.push(
          api
            .adminAktivite({ ...fp, action: "login" })
            .then((r) => setGirisLoglari(r.logs)),
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
  }, [filtreParams, arama, rolFiltre, aktifFiltre, kullaniciMintika, kullaniciKurum, aktifSekme, aktiviteAction]);

  useEffect(() => {
    veriYukle();
  }, []);

  useEffect(() => {
    if (!yukleniyor) veriYukle();
  }, [aktifSekme, tarihAralik, yurtPreset, aktiviteAction]);

  const kurumSec = (code: string, district?: string) => {
    if (district) {
      setMintika(district);
      setKullaniciMintika(district);
    }
    setKurum(code);
    setKullaniciKurum(code);
    setAktifSekme("kullanicilar");
  };

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

  const kullaniciSil = async () => {
    if (!silinecekKullanici) return;
    await api.adminKullaniciSil(silinecekKullanici.id);
    setSilinecekKullanici(null);
    await veriYukle();
  };

  const mevcutEpostalar = useMemo(
    () => kullanicilar.map((u) => u.email.toLowerCase()),
    [kullanicilar],
  );

  const excelImportSec = async (file?: File) => {
    if (!file) return;
    setImportYukleniyor(true);
    setImportSonuc(null);
    try {
      const rows = await excelKurumImportOku(
        file,
        kurumSecenekleriTum.map((k) => k.institutionCode),
        mevcutEpostalar,
        kurumKayitlari.map((k) => ({
          institutionCode: k.institutionCode,
          institutionName: k.institutionName,
          districtName: k.districtName,
          province: k.province,
        })),
      );
      setImportRows(rows);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Excel okunamadı.");
    } finally {
      setImportYukleniyor(false);
    }
  };

  const importBaslat = async () => {
    const aktarilacak = importRows.filter((r) => r.durum === "yeni" || r.durum === "email_cakisiyor");
    if (aktarilacak.length === 0) {
      alert("İçe aktarılacak yeni satır yok.");
      return;
    }
    setImportYukleniyor(true);
    try {
      const sonuc = await api.adminTopluKurumImport({
        rows: aktarilacak.map((r) => ({
          rowNumber: r.rowNumber,
          district: r.district,
          institutionName: r.cleanInstitutionName || r.institutionName,
          institutionCode: r.institutionCode,
          email: r.email,
          province: r.province,
        })),
        createUsers: importKullaniciOlustur,
        defaultPassword: importSifre,
      });
      setImportSonuc(sonuc);
      setImportRows([]);
      await veriYukle();
    } catch (e) {
      alert(e instanceof Error ? e.message : "İçe aktarma başarısız.");
    } finally {
      setImportYukleniyor(false);
    }
  };

  const hataliSatirlariKopyala = () => {
    const text = importRows
      .filter((r) => r.durum !== "yeni" && r.durum !== "email_cakisiyor")
      .map((r) => `${r.rowNumber}\t${r.district}\t${r.institutionName}\t${r.durumMetni}`)
      .join("\n");
    void navigator.clipboard.writeText(text || "Hatalı satır yok.");
  };

  const mintikaGirisLoglari = useMemo(
    () => (mintika ? girisLoglari.filter((l) => l.district === mintika) : girisLoglari),
    [girisLoglari, mintika],
  );

  const kurumSecenekleriTum = useMemo(
    () => {
      if (kurumKayitlari.length > 0) {
        return kurumKayitlari.map((k) => ({
          institutionCode: k.institutionCode,
          institutionName: k.institutionName,
          districtName: k.districtName,
        }));
      }
      return [...new Map(yurts.map((y) => [y.institutionCode, y])).values()];
    },
    [kurumKayitlari, yurts],
  );
  const kurumSecenekleri = useMemo(
    () => (mintika ? kurumSecenekleriTum.filter((y) => y.districtName === mintika) : kurumSecenekleriTum),
    [kurumSecenekleriTum, mintika],
  );

  useEffect(() => {
    if (kurum && !kurumSecenekleri.some((y) => y.institutionCode === kurum)) setKurum("");
  }, [kurum, kurumSecenekleri]);

  const filtreliDestek = destekler.filter((d) => {
    if (destekFiltre && d.status !== destekFiltre) return false;
    if (mintika && d.district !== mintika) return false;
    if (kurum && d.institution_code !== kurum) return false;
    return true;
  });

  const excelIndir = async (tip: "genel" | "mintika" | "yurt" | "kullanici" | "aktivite" | "veri") => {
    const ozet = dashboard?.summary;
    const raporAdi =
      tip === "genel" ? "Genel Bakış" :
      tip === "mintika" ? "Mıntıka Raporu" :
      tip === "yurt" ? "Yurt Takibi Raporu" :
      tip === "kullanici" ? "Kullanıcı Raporu" :
      tip === "aktivite" ? "Aktivite Raporu" : "Veri Sağlığı Raporu";
    const raporGirisleri =
      tip === "genel" ? girisLoglari :
      tip === "mintika" ? mintikaGirisLoglari :
      tip === "aktivite" ? aktivite?.logs :
      undefined;
    await indirAdminExcel({
      raporAdi,
      rangeLabel: dashboard?.range.label ?? tarihAralik,
      filtreler: filtreMetni(),
      ozet: {
        "Toplam yurt": ozet?.totalYurts ?? yurts.length,
        "Toplam kullanıcı": ozet?.totalUsers ?? 0,
        "Bugün aktif yurt": ozet?.todayActiveYurts ?? 0,
        "7+ gün pasif yurt": ozet?.passive7dYurts ?? 0,
        "Açık destek": ozet?.openSupport ?? 0,
        "Giriş kaydı": raporGirisleri?.length ?? 0,
      },
      mintikalar: tip !== "yurt" ? mintikalar : undefined,
      yurts: tip !== "mintika" ? yurts : undefined,
      users: tip === "kullanici" ? kullanicilar : undefined,
      activityLogs: raporGirisleri,
      issues: tip === "veri" ? veriSagligi?.issues : undefined,
    });
  };

  const aktiviteEtiket = (action: string) =>
    ({
      login: "Giriş yaptı",
      export_png: "PNG indirdi",
      export_pdf: "PDF aldı",
      share_whatsapp: "WhatsApp paylaştı",
      open_veli_module: "Veli Bilgilendirme açtı",
      poster_saved: "Taslak kaydetti",
      image_uploaded: "Görsel yükledi",
      profile_saved: "Profil kaydetti",
      support_message_sent: "Destek mesajı gönderdi",
      support_created: "Destek talebi oluşturdu",
    })[action] ?? action;

  return (
    <div className="admin-app-shell">
      <header className="admin-app-topbar">
        <AppBrand kompakt />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>Yönetim Paneli</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.58)", marginTop: 2 }}>Mıntıka / yurt takip merkezi</div>
        </div>
        <a href="/" className="admin-topbar-link">Uygulama</a>
      </header>

      <div className="admin-app-content">
        <div className="admin-filter-card">
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Rapor filtreleri</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Mıntıka, kurum ve tarih aralığını seçin.</div>
          </div>
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
        </div>

        {(dashboard?.range.warning || dashboard?.activityWarning) && (
          <div style={{ padding: 12, borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", fontSize: 12, marginBottom: 12 }}>
            {dashboard.range.warning || dashboard.activityWarning}
          </div>
        )}
        {dashboard?.dataQualityWarning && (
          <div style={{ padding: 12, borderRadius: 10, background: dashboard.summary.dataIssueCount > 0 ? "#fef2f2" : "#ecfdf5", border: `1px solid ${dashboard.summary.dataIssueCount > 0 ? "#fecaca" : "#bbf7d0"}`, color: dashboard.summary.dataIssueCount > 0 ? "#991b1b" : "#166534", fontSize: 12, marginBottom: 12, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            {dashboard.dataQualityWarning}
            {dashboard.summary.dataIssueCount > 0 && <button type="button" onClick={() => setAktifSekme("veri")} style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: "#991b1b", color: "#fff", fontSize: 11, fontWeight: 800 }}>Veri Sağlığına Git</button>}
          </div>
        )}
        <div style={{ padding: 12, borderRadius: 10, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e3a8a", fontSize: 12, marginBottom: 12, lineHeight: 1.55 }}>
          Genel Bakış tüm mıntıkaların girişlerini; Mıntıka Panosu seçili mıntıkanın girişlerini listeler. Excel raporlarında her giriş ayrı satır olarak yer alır.
        </div>

        <div className="admin-tabbar">
          {SEKMELER.map((s) => (
            <button key={s.id} type="button" onClick={() => setAktifSekme(s.id)}
              style={{ flex: "1 1 auto", minWidth: 100, padding: "8px 8px", borderRadius: 9, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer",
                background: aktifSekme === s.id ? "linear-gradient(135deg, #1e3a5f, #2563eb)" : "transparent",
                color: aktifSekme === s.id ? "#fff" : "#64748b" }}>
              {s.simge} {s.label}
            </button>
          ))}
        </div>

        <div className="admin-scroll-area">
        {hata && <div style={{ padding: 14, borderRadius: 12, background: "#fee2e2", color: "#991b1b", marginBottom: 12, fontWeight: 600 }}>Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.</div>}
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
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Genel giriş kayıtları</div>
              <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 10px" }}>
                Seçili tarih aralığındaki tüm girişler — {dashboard?.range.label ?? tarihAralik}
              </p>
              {girisLoglari.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 13 }}>Veri yok</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead><tr style={{ color: "#64748b" }}><th style={{ padding: 6 }}>Tarih / Saat</th><th>Kullanıcı</th><th>İl</th><th>Mıntıka</th><th>Yurt</th></tr></thead>
                  <tbody>
                    {girisLoglari.slice(0, 50).map((l) => (
                      <tr key={l.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td style={{ padding: 6 }}>{formatTarih(l.createdAt)}</td>
                        <td>{l.userName || "—"}</td>
                        <td>{l.province || "—"}</td>
                        <td>{l.district || "—"}</td>
                        <td>{l.institutionName || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {girisLoglari.length > 50 && (
                <p style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>İlk 50 kayıt gösteriliyor. Tümünü Excel Genel Bakış raporundan indirebilirsiniz.</p>
              )}
            </div>
          </div>
        )}

        {!yukleniyor && aktifSekme === "mintika" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mintika && (
              <div style={{ background: "#eff6ff", borderRadius: 12, padding: 12, border: "1px solid #bfdbfe", fontSize: 12, color: "#1e3a8a" }}>
                Mıntıka filtresi: <strong>{mintika}</strong> — {mintikaGirisLoglari.length} giriş kaydı
              </div>
            )}
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
            <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1.5px solid #e2e8f0" }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>
                {mintika ? `${mintika} giriş kayıtları` : "Mıntıka giriş kayıtları"}
              </div>
              {mintikaGirisLoglari.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 13 }}>Veri yok</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead><tr style={{ color: "#64748b" }}><th style={{ padding: 6 }}>Tarih / Saat</th><th>Kullanıcı</th><th>İl</th><th>Mıntıka</th><th>Yurt</th></tr></thead>
                  <tbody>
                    {mintikaGirisLoglari.slice(0, 100).map((l) => (
                      <tr key={l.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td style={{ padding: 6 }}>{formatTarih(l.createdAt)}</td>
                        <td>{l.userName || "—"}</td>
                        <td>{l.province || "—"}</td>
                        <td>{l.district || "—"}</td>
                        <td>{l.institutionName || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
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
            <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1.5px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>Excel ile kurum ve kullanıcı ekle</div>
                  <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>
                    Güncel Talebe sayfasındaki B sütunundan mıntıka, C sütunundan kurum okunur. İl otomatik eşleştirilir.
                  </p>
                </div>
                <label style={{ padding: "9px 14px", borderRadius: 10, background: "#1e3a5f", color: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
                  Excel ile Kurum Ekle
                  <input type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={(e) => void excelImportSec(e.target.files?.[0])} />
                </label>
              </div>
              {importRows.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                      <input type="checkbox" checked={importKullaniciOlustur} onChange={(e) => setImportKullaniciOlustur(e.target.checked)} /> Her kurum için kullanıcı hesabı oluştur
                    </label>
                    <input style={{ ...inputStyle, maxWidth: 160 }} value={importSifre} onChange={(e) => setImportSifre(e.target.value)} placeholder="Ortak şifre" />
                    <button type="button" onClick={importBaslat} disabled={importYukleniyor} style={{ padding: "9px 12px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                      {importYukleniyor ? "İşleniyor..." : "İçe aktarmayı başlat"}
                    </button>
                    <button type="button" onClick={() => setImportRows([])} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 700 }}>İptal</button>
                    <button type="button" onClick={hataliSatirlariKopyala} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #fed7aa", background: "#fff7ed", color: "#9a3412", fontSize: 12, fontWeight: 700 }}>Hatalı satırları kopyala</button>
                  </div>
                  <div style={{ overflow: "auto", maxHeight: 280, border: "1px solid #e2e8f0", borderRadius: 12 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead><tr style={{ background: "#f8fafc", color: "#64748b", textAlign: "left" }}><th style={{ padding: 8 }}>Sıra</th><th>Mıntıka</th><th>İl</th><th>Kurum</th><th>Kurum Kodu</th><th>E-posta</th><th>Durum</th></tr></thead>
                      <tbody>
                        {importRows.map((r) => (
                          <tr key={r.rowNumber} style={{ borderTop: "1px solid #f1f5f9" }}>
                            <td style={{ padding: 8 }}>{r.sira || r.rowNumber}</td>
                            <td>{r.district || "—"}</td>
                            <td>{r.province || "—"}</td>
                            <td>{r.cleanInstitutionName || r.institutionName || "—"}</td>
                            <td>{r.institutionCode || "—"}</td>
                            <td>{r.email || "—"}</td>
                            <td>{r.durumMetni}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {importSonuc && (
                <p style={{ fontSize: 12, color: "#166534", background: "#ecfdf5", border: "1px solid #bbf7d0", borderRadius: 10, padding: 10, marginTop: 10 }}>
                  {importSonuc.readRows} satır okundu. {importSonuc.addedInstitutions} kurum eklendi. {importSonuc.existingInstitutions} kurum zaten vardı. {importSonuc.skippedRows} satır atlandı. {importSonuc.createdUsers} kullanıcı oluşturuldu.
                </p>
              )}
            </div>
            <FiltreSatir>
              <FiltreAlan label="Ara"><input style={inputStyle} value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Ad, e-posta, kurum" /></FiltreAlan>
              <FiltreAlan label="Mıntıka">
                <select style={selectStyle} value={kullaniciMintika} onChange={(e) => { setKullaniciMintika(e.target.value); setKullaniciKurum(""); }}>
                  <option value="">Tümü</option>
                  {TRACKED_DISTRICTS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </FiltreAlan>
              <FiltreAlan label="Kurum">
                <select style={selectStyle} value={kullaniciKurum} onChange={(e) => setKullaniciKurum(e.target.value)}>
                  <option value="">Tümü</option>
                  {(kullaniciMintika ? kurumSecenekleri : kurumSecenekleriTum).map((y) => (
                    <option key={y.institutionCode} value={y.institutionCode}>{y.institutionName}</option>
                  ))}
                </select>
              </FiltreAlan>
              <FiltreAlan label="Rol">
                <select style={selectStyle} value={rolFiltre} onChange={(e) => setRolFiltre(e.target.value)}>
                  <option value="">Tümü</option><option value="user">Kullanıcı</option><option value="admin">Admin</option>
                </select>
              </FiltreAlan>
              <FiltreAlan label="Durum">
                <select style={selectStyle} value={aktifFiltre} onChange={(e) => setAktifFiltre(e.target.value)}>
                  <option value="">Tümü</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif / silinmiş</option>
                </select>
              </FiltreAlan>
              <button type="button" onClick={veriYukle} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Uygula</button>
            </FiltreSatir>
            {kullaniciListeHata && (
              <div style={{ padding: 12, borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 12, fontWeight: 600 }}>
                Kullanıcı verisi okunamadı: {kullaniciListeHata}
              </div>
            )}
            {kullaniciListeOzet && !kullaniciListeHata && (
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {kullaniciListeOzet.filteredCount} kayıt listeleniyor
                {aktifFiltre === "active" ? " (yalnızca aktif)" : aktifFiltre === "inactive" ? " (pasif/silinmiş)" : ` (ham ${kullaniciListeOzet.rawCount} kayıt)`}
              </div>
            )}
            <RaporTablo
              kullanicilar={kullanicilar}
              onPasif={kullaniciPasif}
              onSifre={sifreSifirla}
              onSil={setSilinecekKullanici}
              showActions
              showRol
              showDurum
              bosMesaj={
                kullaniciListeOzet && kullaniciListeOzet.rawCount > 0 && kullanicilar.length === 0
                  ? "Filtreye uyan kullanıcı yok. Durum: Aktif veya filtreleri Tümü yapmayı deneyin."
                  : "Veri yok"
              }
            />
          </div>
        )}

        {!yukleniyor && aktifSekme === "aktivite" && (
          <div>
            <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1.5px solid #e2e8f0", marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>Aktivite Takibi</div>
              <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0", lineHeight: 1.5 }}>
                Kullanıcıların sisteme giriş, afiş indirme, PDF alma ve WhatsApp paylaşma hareketlerini tarih aralığına göre gösterir.
                {!aktivite?.hasActivityLogs ? " Şu anda sadece giriş tarihleriyle sınırlı veri olabilir; PNG/PDF/WhatsApp için aktivite kaydı bulunmuyorsa 0 gösterilir." : ""}
              </p>
            </div>
            <FiltreSatir>
              <FiltreAlan label="İşlem">
                <select style={selectStyle} value={aktiviteAction} onChange={(e) => setAktiviteAction(e.target.value)}>
                  <option value="">Tümü</option>
                  <option value="login">Giriş yaptı</option>
                  <option value="export_png">PNG indirdi</option>
                  <option value="export_pdf">PDF aldı</option>
                  <option value="share_whatsapp">WhatsApp paylaştı</option>
                  <option value="open_veli_module">Veli Bilgilendirme açtı</option>
                  <option value="poster_saved">Taslak kaydetti</option>
                  <option value="image_uploaded">Görsel yükledi</option>
                  <option value="profile_saved">Profil kaydetti</option>
                  <option value="support_message_sent">Destek mesajı gönderdi</option>
                  <option value="support_created">Destek talebi oluşturdu</option>
                </select>
              </FiltreAlan>
            </FiltreSatir>
            {aktivite?.warning && <p style={{ fontSize: 12, color: "#b45309", marginBottom: 8 }}>{aktivite.warning}</p>}
            {aktivite && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                <StatKart baslik="Giriş" deger={aktivite.summary.loginCount} renk="#2563eb" simge="🔑" />
                <StatKart baslik="Aktif kullanıcı" deger={aktivite.summary.activeUsers} renk="#0d9488" simge="👤" />
                <StatKart baslik="Aktif yurt" deger={aktivite.summary.activeYurts} renk="#16a34a" simge="🏫" />
                <StatKart baslik="PNG indirme" deger={aktivite.summary.exportPng} renk="#64748b" simge="🖼️" altMetin={aktivite.summary.exportPng === 0 ? "Bu hareket için kayıt bulunmuyor." : undefined} />
                <StatKart baslik="PDF alma" deger={aktivite.summary.exportPdf} renk="#dc2626" simge="📄" altMetin={aktivite.summary.exportPdf === 0 ? "Bu hareket için kayıt bulunmuyor." : undefined} />
                <StatKart baslik="WhatsApp" deger={aktivite.summary.shareWhatsapp} renk="#16a34a" simge="💬" altMetin={aktivite.summary.shareWhatsapp === 0 ? "Bu hareket için kayıt bulunmuyor." : undefined} />
              </div>
            )}
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead><tr style={{ color: "#64748b" }}><th style={{ padding: 8 }}>Tarih / Saat</th><th>Kullanıcı</th><th>İl</th><th>Mıntıka</th><th>Yurt / Kurum</th><th>İşlem</th><th>Detay</th></tr></thead>
                <tbody>
                  {(aktivite?.logs ?? []).map((l) => (
                    <tr key={l.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ padding: 8 }}>{formatTarih(l.createdAt)}</td>
                      <td>{l.userName || "—"}</td>
                      <td>{l.province || "—"}</td>
                      <td>{l.district || "—"}</td>
                      <td>{l.institutionName || l.institutionCode || "—"}</td>
                      <td>{aktiviteEtiket(l.action)}</td>
                      <td>{l.metadata ? JSON.stringify(l.metadata).slice(0, 80) : "—"}</td>
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
            <div style={{ background: "#fff", borderRadius: 14, padding: 14, border: "1.5px solid #e2e8f0", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>Veri Sağlığı (teşhis)</div>
              <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>
                Bu ekran yalnızca sorunları listeler. Auth bağlama, kurum eşleştirme, toplu onarım ve kayıt pasifleştirme işlemleri panelden yapılmaz; backend onarımı hazır olduğunda ayrıca çalıştırılacaktır.
              </p>
            </div>
            <StatKart baslik="Veri sağlığı puanı" deger={veriSagligi.score ?? "—"} renk="#0d9488" simge="🩺" altMetin={`${veriSagligi.issueCount} sorun`} />
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", marginTop: 12, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead><tr style={{ color: "#64748b" }}><th style={{ padding: 8 }}>Tür</th><th>Kayıt</th><th>Açıklama</th><th>Öneri</th></tr></thead>
                <tbody>
                  {veriSagligi.issues.map((i) => (
                    <tr key={i.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ padding: 8 }}>{i.type}</td>
                      <td style={{ padding: 8 }}>{i.record}</td>
                      <td style={{ padding: 8 }}>{i.description}</td>
                      <td style={{ padding: 8 }}>{i.suggestion}</td>
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
                  <option value="open">Açık</option>
                  <option value="yeni">Yeni</option>
                  <option value="inceleniyor">İnceleniyor</option>
                  <option value="cozuldu">Çözüldü</option>
                </select>
              </FiltreAlan>
            </FiltreSatir>
            {filtreliDestek.length === 0 && <p style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Veri yok</p>}
            {filtreliDestek.map((m) => (
              <div key={m.id} style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1.5px solid #e2e8f0", marginBottom: 12 }}>
                <div style={{ fontWeight: 800 }}>{m.subject || "Destek Talebi"} · {m.userName || "İsimsiz"}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{m.userEmail || "—"} · {m.institution_name || "—"} · {m.district || "—"} · {m.province || "—"} · {formatTarih(m.createdAt)}</div>
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
            {(["genel", "mintika", "yurt", "kullanici", "aktivite", "veri"] as const).map((t) => (
              <button key={t} type="button" onClick={() => excelIndir(t)}
                style={{ padding: 12, borderRadius: 12, border: "1.5px solid #e2e8f0", background: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                📥 {t === "genel" ? "Genel Bakış Raporu" : t === "mintika" ? "Mıntıka Raporu" : t === "yurt" ? "Yurt Takibi Raporu" : t === "kullanici" ? "Kullanıcı Raporu" : t === "aktivite" ? "Aktivite Raporu" : "Veri Sağlığı Raporu"} indir
              </button>
            ))}
          </div>
        )}
        </div>
      </div>
      {silinecekKullanici && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ maxWidth: 420, background: "#fff", borderRadius: 16, padding: 18, boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#991b1b" }}>Kullanıcıyı sil / pasifleştir</div>
            <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.55 }}>
              Bu kullanıcı silinecek. Activity log kayıtları korunur; kullanıcı raporlarda aktif sayılmaz.
            </p>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>{silinecekKullanici.name} · {silinecekKullanici.email}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setSilinecekKullanici(null)} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontWeight: 700 }}>Vazgeç</button>
              <button type="button" onClick={kullaniciSil} style={{ padding: "9px 12px", borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontWeight: 800 }}>Evet, sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RaporTablo({
  kullanicilar,
  onPasif,
  onSifre,
  onSil,
  showActions,
  showRol,
  showDurum,
  bosMesaj,
  seciliIds,
  onSec,
}: {
  kullanicilar: AdminKullanici[];
  onPasif?: (u: AdminKullanici) => void;
  onSifre?: (u: AdminKullanici) => void;
  onSil?: (u: AdminKullanici) => void;
  showActions?: boolean;
  showRol?: boolean;
  showDurum?: boolean;
  bosMesaj?: string;
  seciliIds?: string[];
  onSec?: (id: string, checked: boolean) => void;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b" }}>
            {onSec && <th style={{ padding: 10, width: 36 }}>Seç</th>}
            <th style={{ padding: 10 }}>Ad</th><th>Yurt</th><th>İl</th><th>Mıntıka</th>
            {showRol && <th>Rol</th>}
            <th>Son giriş</th><th>Durum</th>
            {showActions && <th>İşlem</th>}
          </tr>
        </thead>
        <tbody>
          {kullanicilar.map((u) => (
            <tr key={u.id} style={{ borderTop: "1px solid #f1f5f9" }}>
              {onSec && (
                <td style={{ padding: 10 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(seciliIds?.includes(u.id))}
                    onChange={(e) => onSec(u.id, e.target.checked)}
                    title="Kullanıcıyı seç"
                  />
                </td>
              )}
              <td style={{ padding: 10 }}>
                <div style={{ fontWeight: 700 }}>{u.name}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>{u.email}</div>
                {!u.institutionCode && <span style={{ fontSize: 9, color: "#b45309", fontWeight: 700 }}>Yurt eşleşmemiş</span>}
              </td>
              <td>{u.institutionName || "—"}</td>
              <td>{u.province || "—"}</td>
              <td>{u.district || "—"}</td>
              {showRol && <td>{ROL_LABEL[normalizeRole(u.role, u.isAdmin)]}</td>}
              <td>{formatTarih(u.lastLoginAt)}</td>
              <td>
                {showDurum ? (
                  !u.deletedAt && u.isActive !== false && u.status !== "inactive" && u.status !== "deleted" ? (
                    u.activityStatus ? <DurumRozet durum={u.activityStatus} /> : <span style={{ fontSize: 10, color: "#16a34a" }}>Aktif</span>
                  ) : (
                    <span style={{ fontSize: 10, color: "#b45309", fontWeight: 700 }}>{u.deletedAt ? "Silinmiş" : "Pasif"}</span>
                  )
                ) : (
                  u.activityStatus && <DurumRozet durum={u.activityStatus} />
                )}
              </td>
              {showActions && (
                <td style={{ padding: 8 }}>
                  {onPasif && <button type="button" onClick={() => onPasif(u)} style={{ fontSize: 10, display: "block", marginBottom: 4, cursor: "pointer" }}>{u.isActive ? "Pasif" : "Aktif"}</button>}
                  <button type="button" onClick={() => navigator.clipboard.writeText(`Nehari Veli Bilgilendirme giriş bilgisi\nE-posta: ${u.email}\nKurum: ${u.institutionName || "—"}\nMıntıka: ${u.district || "—"}\nRol: ${ROL_LABEL[normalizeRole(u.role, u.isAdmin)]}`)} style={{ fontSize: 10, display: "block", marginBottom: 4, cursor: "pointer" }}>Giriş bilgisi kopyala</button>
                  {onSifre && <button type="button" onClick={() => onSifre(u)} style={{ fontSize: 10, cursor: "pointer" }}>Şifre sıfırla</button>}
                  <button type="button" onClick={() => navigator.clipboard.writeText(hatirlatmaMesaji({ name: u.name, email: u.email, institutionName: u.institutionName ?? undefined, district: u.district ?? undefined }))} style={{ fontSize: 10, display: "block", marginTop: 4, cursor: "pointer" }}>Hatırlatma</button>
                  {onSil && <button type="button" onClick={() => onSil(u)} style={{ fontSize: 10, display: "block", marginTop: 4, cursor: "pointer", color: "#dc2626" }}>Sil</button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {kullanicilar.length === 0 && <p style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>{bosMesaj ?? "Veri yok"}</p>}
    </div>
  );
}

