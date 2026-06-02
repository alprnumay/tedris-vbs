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

const PRIMARY_ADMIN_EMAIL = "alprn0604@gmail.com";

function kullaniciSilinebilirMi(user: AdminKullanici): boolean {
  return user.email.trim().toLocaleLowerCase("tr-TR") !== PRIMARY_ADMIN_EMAIL;
}

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
  const [silinecekKullanici, setSilinecekKullanici] = useState<AdminKullanici | null>(null);
  const [silmeOnayAsamasi, setSilmeOnayAsamasi] = useState<1 | 2>(1);
  const [seciliKullaniciIds, setSeciliKullaniciIds] = useState<string[]>([]);
  const [topluSilYukleniyor, setTopluSilYukleniyor] = useState(false);
  const [importRows, setImportRows] = useState<KurumImportSatiri[]>([]);
  const [importYukleniyor, setImportYukleniyor] = useState(false);
  const [importKullaniciOlustur, setImportKullaniciOlustur] = useState(false);
  const [importSifre, setImportSifre] = useState("tedris2026");
  const [importSonuc, setImportSonuc] = useState<AdminImportCommitResponse | null>(null);
  const [seciliIssueIds, setSeciliIssueIds] = useState<string[]>([]);
  const [eslemeModal, setEslemeModal] = useState<{ userIds: string[] } | null>(null);
  const [eslemeMintika, setEslemeMintika] = useState("");
  const [eslemeKurum, setEslemeKurum] = useState("");

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
        api.adminYurtKayitlari().then((r) => setKurumKayitlari(r.institutions)),
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
      if (aktifSekme === "aktivite" || aktifSekme === "excel") {
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

  useEffect(() => {
    const mevcutIds = new Set(kullanicilar.map((u) => u.id));
    setSeciliKullaniciIds((prev) => prev.filter((id) => mevcutIds.has(id)));
  }, [kullanicilar]);

  const silinebilirKullanicilar = useMemo(
    () => kullanicilar.filter(kullaniciSilinebilirMi),
    [kullanicilar],
  );

  const seciliSilinebilirKullanicilar = useMemo(
    () => silinebilirKullanicilar.filter((u) => seciliKullaniciIds.includes(u.id)),
    [silinebilirKullanicilar, seciliKullaniciIds],
  );

  const tumKullanicilarSecili = silinebilirKullanicilar.length > 0
    && silinebilirKullanicilar.every((u) => seciliKullaniciIds.includes(u.id));

  const kullaniciSec = (id: string, checked: boolean) => {
    setSeciliKullaniciIds((prev) => checked ? [...new Set([...prev, id])] : prev.filter((current) => current !== id));
  };

  const tumKullanicilariSec = (checked: boolean) => {
    setSeciliKullaniciIds(checked ? silinebilirKullanicilar.map((u) => u.id) : []);
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

  const kurumSec = (code: string, district?: string) => {
    if (district) setMintika(district);
    setKurum(code);
    setAktifSekme("kullanicilar");
  };

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
      },
      mintikalar: tip !== "yurt" ? mintikalar : undefined,
      yurts: tip !== "mintika" ? yurts : undefined,
      users: tip === "kullanici" ? kullanicilar : undefined,
      activityLogs: tip === "aktivite" ? aktivite?.logs : undefined,
      issues: tip === "veri" ? veriSagligi?.issues : undefined,
    });
  };

  const mevcutEpostalar = kullanicilar.map((u) => u.email.toLowerCase());

  const excelImportSec = async (file?: File) => {
    if (!file) return;
    setImportYukleniyor(true);
    setImportSonuc(null);
    try {
      const rows = await excelKurumImportOku(
        file,
        kurumSecenekleriTum.map((k) => k.institutionCode),
        mevcutEpostalar,
        kurumSecenekleriTum,
      );
      setImportRows(rows);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Excel okunamadı.");
    } finally {
      setImportYukleniyor(false);
    }
  };

  const importBaslat = async () => {
    setImportYukleniyor(true);
    try {
      const sonuc = await api.adminTopluKurumImport({
        rows: importRows.map((r) => ({
          rowNumber: r.rowNumber,
          district: r.district,
          institutionName: r.cleanInstitutionName || r.institutionName,
          institutionCode: r.institutionCode,
          email: r.email,
          province: r.province,
        })),
        totalRows: importRows.length,
        createUsers: importKullaniciOlustur,
        defaultPassword: importSifre,
      });
      setImportSonuc(sonuc);
      await veriYukle();
    } finally {
      setImportYukleniyor(false);
    }
  };

  const hataliSatirlariKopyala = () => {
    const text = importRows
      .filter((r) => r.durum !== "yeni")
      .map((r) => `${r.rowNumber}\t${r.district}\t${r.institutionName}\t${r.durumMetni}`)
      .join("\n");
    void navigator.clipboard.writeText(text || "Hatalı satır yok.");
  };

  const kullaniciSil = async () => {
    if (!silinecekKullanici) return;
    await api.adminKullaniciSil(silinecekKullanici.id);
    setSilinecekKullanici(null);
    setSilmeOnayAsamasi(1);
    setSeciliKullaniciIds((prev) => prev.filter((id) => id !== silinecekKullanici.id));
    await veriYukle();
  };

  const silmeModalAc = (u: AdminKullanici) => {
    if (!kullaniciSilinebilirMi(u)) {
      alert("Ana admin kullanıcısı silinemez.");
      return;
    }
    setSilinecekKullanici(u);
    setSilmeOnayAsamasi(1);
  };

  const topluKullaniciSil = async (mode: "selected" | "all") => {
    const targets = mode === "all" ? silinebilirKullanicilar : seciliSilinebilirKullanicilar;
    if (targets.length === 0) {
      alert(mode === "all" ? "Silinebilecek kullanıcı yok." : "Silmek için kullanıcı seçin.");
      return;
    }
    const label = mode === "all" ? "listedeki tüm silinebilir kullanıcı" : "seçili kullanıcı";
    const onay = window.confirm(`${targets.length} ${label} silinecek/pasifleştirilecek. Ana admin korunur. Devam edilsin mi?`);
    if (!onay) return;

    setTopluSilYukleniyor(true);
    try {
      for (const user of targets) {
        await api.adminKullaniciSil(user.id);
      }
      setSeciliKullaniciIds([]);
      await veriYukle();
      alert(`${targets.length} kullanıcı silindi/pasifleştirildi.`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Toplu silme başarısız.");
    } finally {
      setTopluSilYukleniyor(false);
    }
  };

  const seciliIssueUserIds = () =>
    (veriSagligi?.issues ?? [])
      .filter((i) => seciliIssueIds.includes(i.id) && i.targetKind === "user" && i.targetId)
      .map((i) => String(i.targetId));

  const veriSagligiAksiyon = async (action: "deactivate" | "ignore") => {
    const userIds = seciliIssueUserIds();
    await api.adminVeriSagligiAksiyon({ action, issueIds: seciliIssueIds, userIds });
    setSeciliIssueIds([]);
    await veriYukle();
  };

  const eslestir = async () => {
    if (!eslemeModal || !eslemeMintika || !eslemeKurum) return;
    const y = kurumSecenekleriTum.find((k) => k.institutionCode === eslemeKurum);
    await api.adminVeriSagligiAksiyon({
      action: "match",
      userIds: eslemeModal.userIds,
      district: eslemeMintika,
      institutionName: y?.institutionName ?? eslemeKurum,
      institutionCode: y?.institutionCode,
    });
    setEslemeModal(null);
    setEslemeMintika("");
    setEslemeKurum("");
    setSeciliIssueIds([]);
    await veriYukle();
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
            <div style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1.5px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>Gelişmiş işlemler</div>
                  <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>Güncel Talebe sayfasındaki B sütunundan mıntıka, C sütunundan kurum okunur. Önizleme onaylanmadan veri yazılmaz.</p>
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
                      <thead><tr style={{ background: "#f8fafc", color: "#64748b", textAlign: "left" }}><th style={{ padding: 8 }}>Sıra</th><th>Mıntıka</th><th>Excel’deki Kurum Adı</th><th>Temizlenmiş Kurum Adı</th><th>Kurum Kodu</th><th>Oluşacak E-posta</th><th>Durum</th></tr></thead>
                      <tbody>
                        {importRows.map((r) => (
                          <tr key={r.rowNumber} style={{ borderTop: "1px solid #f1f5f9" }}>
                            <td style={{ padding: 8 }}>{r.sira || r.rowNumber}</td><td>{r.district || "—"}</td><td>{r.institutionName || "—"}</td><td>{r.cleanInstitutionName || "—"}</td><td>{r.institutionCode || "—"}</td><td>{r.email || "—"}</td><td>{r.durumMetni}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importSonuc && (
                    <div style={{ fontSize: 12, color: "#166534", background: "#ecfdf5", border: "1px solid #bbf7d0", borderRadius: 10, padding: 10, marginTop: 10, lineHeight: 1.7 }}>
                      <div>Toplam okunan satır: <b>{importSonuc.readRows}</b></div>
                      <div>Geçerli satır: <b>{importSonuc.validRows ?? importSonuc.readRows - importSonuc.skippedRows}</b></div>
                      <div>Yeni kurum eklenen: <b>{importSonuc.addedInstitutions}</b></div>
                      <div>Zaten var olan kurum: <b>{importSonuc.existingInstitutions}</b></div>
                      <div>Yeni kullanıcı oluşturulan: <b>{importSonuc.createdUsers}</b></div>
                      <div>Zaten var olan kullanıcı: <b>{importSonuc.existingUsers}</b></div>
                      <div>Atlanan satır: <b>{importSonuc.skippedRows}</b></div>
                      {importSonuc.errors.length > 0 && (
                        <details style={{ marginTop: 8 }}>
                          <summary style={{ cursor: "pointer", fontWeight: 800 }}>Atlanan / uyarılı satırlar</summary>
                          <ul style={{ margin: "6px 0 0", paddingLeft: 18, color: "#475569" }}>
                            {importSonuc.errors.slice(0, 20).map((err, idx) => (
                              <li key={`${err.rowNumber ?? "row"}-${idx}`}>
                                Satır {err.rowNumber ?? "?"}: {err.reason} {err.institutionName ? `Kurum: ${err.institutionName}.` : ""} {err.email ? `E-posta: ${err.email}.` : ""}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <FiltreSatir>
              <FiltreAlan label="Ara"><input style={inputStyle} value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Ad, e-posta" /></FiltreAlan>
              <FiltreAlan label="Rol">
                <select style={selectStyle} value={rolFiltre} onChange={(e) => setRolFiltre(e.target.value)}>
                  <option value="">Tümü</option><option value="user">Kullanıcı</option><option value="admin">Admin</option>
                </select>
              </FiltreAlan>
              <button type="button" onClick={veriYukle} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Uygula</button>
            </FiltreSatir>
            <div style={{ background: "#fff", borderRadius: 14, padding: 12, border: "1.5px solid #e2e8f0", display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 800, color: "#334155" }}>
                <input type="checkbox" checked={tumKullanicilarSecili} onChange={(e) => tumKullanicilariSec(e.target.checked)} disabled={silinebilirKullanicilar.length === 0 || topluSilYukleniyor} />
                Tümünü seç
              </label>
              <div style={{ fontSize: 12, color: "#64748b", flex: 1 }}>
                {seciliSilinebilirKullanicilar.length} seçili · {silinebilirKullanicilar.length} silinebilir kullanıcı
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={() => void topluKullaniciSil("selected")} disabled={topluSilYukleniyor || seciliSilinebilirKullanicilar.length === 0} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #fecaca", background: "#fff", color: "#dc2626", fontSize: 12, fontWeight: 800, cursor: topluSilYukleniyor || seciliSilinebilirKullanicilar.length === 0 ? "not-allowed" : "pointer", opacity: topluSilYukleniyor || seciliSilinebilirKullanicilar.length === 0 ? 0.55 : 1 }}>
                  Seçilenleri sil
                </button>
                <button type="button" onClick={() => void topluKullaniciSil("all")} disabled={topluSilYukleniyor || silinebilirKullanicilar.length === 0} style={{ padding: "9px 12px", borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontSize: 12, fontWeight: 800, cursor: topluSilYukleniyor || silinebilirKullanicilar.length === 0 ? "not-allowed" : "pointer", opacity: topluSilYukleniyor || silinebilirKullanicilar.length === 0 ? 0.55 : 1 }}>
                  {topluSilYukleniyor ? "Siliniyor..." : "Listedeki tümünü sil"}
                </button>
              </div>
            </div>
            <RaporTablo
              kullanicilar={kullanicilar}
              onPasif={kullaniciPasif}
              onSifre={sifreSifirla}
              onSil={silmeModalAc}
              showActions
              showRol
              seciliIds={seciliKullaniciIds}
              onSec={kullaniciSec}
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
                <thead><tr style={{ color: "#64748b" }}><th style={{ padding: 8 }}>Tarih / Saat</th><th>Kullanıcı</th><th>Mıntıka</th><th>Yurt / Kurum</th><th>İşlem</th><th>Detay</th></tr></thead>
                <tbody>
                  {(aktivite?.logs ?? []).map((l) => (
                    <tr key={l.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ padding: 8 }}>{formatTarih(l.createdAt)}</td>
                      <td>{l.userName || "—"}</td>
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
            {seciliIssueIds.length > 0 && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#fff7ed", border: "1px solid #fed7aa", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <strong style={{ fontSize: 12, color: "#9a3412" }}>{seciliIssueIds.length} kayıt seçildi</strong>
                <button type="button" onClick={() => setEslemeModal({ userIds: seciliIssueUserIds() })} style={{ padding: "7px 10px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 11 }}>Seçilenleri eşleştir</button>
                <button type="button" onClick={() => { if (confirm("Seçili kayıtlar silinecek veya pasifleştirilecek. Bu işlem raporları etkileyebilir. Devam etmek istiyor musunuz?")) void veriSagligiAksiyon("deactivate"); }} style={{ padding: "7px 10px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: 11 }}>Seçilenleri pasifleştir</button>
                <button type="button" onClick={() => void veriSagligiAksiyon("ignore")} style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontWeight: 700, fontSize: 11 }}>Seçilenleri yoksay</button>
              </div>
            )}
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", marginTop: 12, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead><tr style={{ color: "#64748b" }}><th style={{ padding: 8 }}><input type="checkbox" checked={seciliIssueIds.length > 0 && seciliIssueIds.length === veriSagligi.issues.length} onChange={(e) => setSeciliIssueIds(e.target.checked ? veriSagligi.issues.map((i) => i.id) : [])} /></th><th>Tür</th><th>Kayıt</th><th>Açıklama</th><th>Öneri</th><th>İşlem</th></tr></thead>
                <tbody>
                  {veriSagligi.issues.map((i) => (
                    <tr key={i.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ padding: 8 }}><input type="checkbox" checked={seciliIssueIds.includes(i.id)} onChange={(e) => setSeciliIssueIds((prev) => e.target.checked ? [...prev, i.id] : prev.filter((x) => x !== i.id))} /></td>
                      <td>{i.type}</td>
                      <td>{i.record}</td>
                      <td>{i.description}</td>
                      <td>{i.suggestion}</td>
                      <td style={{ padding: 8 }}>
                        {i.targetKind === "user" && i.targetId && <button type="button" onClick={() => setEslemeModal({ userIds: [String(i.targetId)] })} style={{ fontSize: 10, marginRight: 4 }}>Eşleştir</button>}
                        {i.targetKind === "user" && i.targetId && <button type="button" onClick={() => { if (confirm("Bu kayıt pasifleştirilecek. Devam etmek istiyor musunuz?")) void api.adminVeriSagligiAksiyon({ action: "deactivate", userIds: [String(i.targetId)], issueIds: [i.id] }).then(veriYukle); }} style={{ fontSize: 10, color: "#dc2626" }}>Sil / Pasifleştir</button>}
                      </td>
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
              {silmeOnayAsamasi === 1
                ? "Bu kullanıcı silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?"
                : "Son onay: Bu kullanıcı artık kullanıcı listesinde görünmeyecek ve aktif raporlara dahil edilmeyecek."}
              {" "}Activity log kayıtları korunur.
            </p>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>{silinecekKullanici.name} · {silinecekKullanici.email}</div>
            {normalizeRole(silinecekKullanici.role, silinecekKullanici.isAdmin) === "admin" && (
              <div style={{ fontSize: 12, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 10, marginBottom: 12 }}>
                Bu kayıt admin yetkisine sahip. Silmek için iki onay gerekir.
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => { setSilinecekKullanici(null); setSilmeOnayAsamasi(1); }} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontWeight: 700 }}>Vazgeç</button>
              <button
                type="button"
                onClick={() => silmeOnayAsamasi === 1 ? setSilmeOnayAsamasi(2) : void kullaniciSil()}
                style={{ padding: "9px 12px", borderRadius: 10, border: "none", background: "#dc2626", color: "#fff", fontWeight: 800 }}
              >
                {silmeOnayAsamasi === 1 ? "İlk onayı ver" : "Son onay: sil"}
              </button>
            </div>
          </div>
        </div>
      )}
      {eslemeModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ maxWidth: 460, background: "#fff", borderRadius: 16, padding: 18, boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 16, fontWeight: 900 }}>Kullanıcıyı kuruma eşleştir</div>
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <select style={selectStyle} value={eslemeMintika} onChange={(e) => { setEslemeMintika(e.target.value); setEslemeKurum(""); }}>
                <option value="">Mıntıka seç</option>
                {TRACKED_DISTRICTS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select style={selectStyle} value={eslemeKurum} onChange={(e) => setEslemeKurum(e.target.value)}>
                <option value="">Kurum seç</option>
                {kurumSecenekleriTum.filter((k) => !eslemeMintika || k.districtName === eslemeMintika).map((k) => <option key={k.institutionCode} value={k.institutionCode}>{k.institutionName}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
              <button type="button" onClick={() => setEslemeModal(null)} style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontWeight: 700 }}>İptal</button>
              <button type="button" onClick={eslestir} style={{ padding: "9px 12px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontWeight: 800 }}>Eşleştir</button>
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
  seciliIds,
  onSec,
}: {
  kullanicilar: AdminKullanici[];
  onPasif?: (u: AdminKullanici) => void;
  onSifre?: (u: AdminKullanici) => void;
  onSil?: (u: AdminKullanici) => void;
  showActions?: boolean;
  showRol?: boolean;
  seciliIds?: string[];
  onSec?: (id: string, checked: boolean) => void;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#f8fafc", textAlign: "left", color: "#64748b" }}>
            {onSec && <th style={{ padding: 10, width: 36 }}>Seç</th>}
            <th style={{ padding: 10 }}>Ad</th><th>Yurt</th><th>Mıntıka</th>
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
                    disabled={!kullaniciSilinebilirMi(u)}
                    onChange={(e) => onSec(u.id, e.target.checked)}
                    title={kullaniciSilinebilirMi(u) ? "Kullanıcıyı seç" : "Ana admin silinemez"}
                  />
                </td>
              )}
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
      {kullanicilar.length === 0 && <p style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Veri yok</p>}
    </div>
  );
}

