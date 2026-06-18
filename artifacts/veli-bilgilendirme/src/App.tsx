import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import { Toaster, toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { FormData, SablonTuru } from "./types";
import { aciklamaolustur } from "./lib/dil";
import { api, kullaniciAdminMi, type KullaniciBilgisi } from "./lib/api";
import { backendApi, type PosterDraftData } from "./lib/backendApi";
import FormAlani from "./components/FormAlani";
import { VeliOnizlemeIcerik } from "./components/veli/VeliOnizlemeIcerik";
import { VeliMobilNav } from "./components/veli/VeliMobilNav";
import { VeliOnizlemeMobil } from "./components/veli/VeliOnizlemeMobil";
import { SABLON_LISTESI } from "./lib/sablonlar";
import { veliKaliteKontrol } from "./lib/veli/veliKaliteKontrol";
import { validateVeliWizardStep, VELI_WIZARD_STEPS, VELI_WIZARD_LAST_STEP } from "./lib/veli/veliWizardSteps";
import { PreviewPanel } from "./components/veli/wizard/PreviewPanel";
import { PreviewModeToggle, type VeliPreviewMode } from "./components/veli/wizard/PreviewModeToggle";
import { QualityPanel } from "./components/veli/wizard/QualityPanel";
import { WhatsAppQualityPanel } from "./components/veli/wizard/WhatsAppQualityPanel";
import { BottomActionBar } from "./components/veli/wizard/BottomActionBar";
import { VeliPreviewScaler } from "./components/veli/VeliPreviewScaler";
import { VELI_POSTER_H, VELI_POSTER_W } from "./lib/veli/veliPosterEngine";
import { VELI_WA_POSTER_H, VELI_WA_POSTER_W } from "./lib/veli/veliWhatsappPosterEngine";
import { veliWhatsappMesajiOlustur } from "./lib/veli/veliWhatsappMesaji";
import GirisEkrani from "./components/GirisEkrani";
import DestekModal from "./components/DestekModal";
import AdminSayfasi from "./components/AdminSayfasi";
import { AppBrand } from "./components/AppBrand";
import { CategoryHome } from "./components/ana-giris/CategoryHome";
import { DenemeSinaviModulu } from "./components/deneme/DenemeSinaviModulu";
import { KolayAfisModulu } from "./components/kolay-afis/KolayAfisModulu";
import { DavetProviders } from "./modules/davet/DavetProviders";
import { DavetRouter } from "./modules/davet/DavetRouter";

function isDavetPathname(): boolean {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/davet");
}

const KurumsalKimlikModulu = lazy(() =>
  import("./components/kurumsal-kimlik/KurumsalKimlikModulu").then((m) => ({
    default: m.KurumsalKimlikModulu,
  })),
);

const POSTER_W = VELI_POSTER_W;
const POSTER_H = VELI_POSTER_H;

const baslangicForm: FormData = {
  kurumAdi: "",
  isim: "",
  rol: "",
  faaliyetSayisi: 1,
  faaliyetler: [
    { tur: "", alan: "", ozelNot: "" },
    { tur: "", alan: "", ozelNot: "" },
    { tur: "", alan: "", ozelNot: "" },
  ],
  metinUzunlugu: "detayli",
  posterMetni: "",
  ekNot: "",
  gorseller: [],
  seciliBaslikIdx: 0,
};

function isPosterDraftData(data: unknown): data is PosterDraftData {
  const d = data as Partial<PosterDraftData> | null;
  return Boolean(d && typeof d === "object" && d.form && typeof d.seciliSablon === "string");
}

function MainApp() {
  const [kullanici, setKullanici] = useState<KullaniciBilgisi | null | undefined>(undefined);
  /** Giriş sonrası: kategori seçimi, Veli Bilgilendirme üretimi veya Deneme sınavı modülü. */
  const [homeModu, setHomeModu] = useState<"kategoriler" | "veli" | "deneme" | "logo" | "yatili">("kategoriler");
  const [form, setForm] = useState<FormData>(baslangicForm);
  const [seciliSablon, setSeciliSablon] = useState<SablonTuru>("akademik");
  const [aktifSekme, setAktifSekme] = useState<"form" | "onizleme" | "yonetim">("form");
  const [indiriliyor, setIndiriliyor] = useState(false);
  const [pdfYukleniyor, setPdfYukleniyor] = useState(false);
  const [waGorselIndiriliyor, setWaGorselIndiriliyor] = useState(false);
  const [waPaylasiliyor, setWaPaylasiliyor] = useState(false);
  const [previewMode, setPreviewMode] = useState<VeliPreviewMode>("normal");
  const [metinDuzenlendi, setMetinDuzenlendi] = useState(false);
  const [destekAcik, setDestekAcik] = useState(false);
  const [formAdim, setFormAdim] = useState<1 | 2>(1);
  const [activeStep, setActiveStep] = useState(0);
  const [stepUyari, setStepUyari] = useState<string | null>(null);
  const [mobilOnizlemeAcik, setMobilOnizlemeAcik] = useState(false);
  const [taslakMenuAcik, setTaslakMenuAcik] = useState(false);
  const [taslakIslem, setTaslakIslem] = useState<"kaydet" | "yukle" | "sil" | null>(null);
  const [sonTaslakId, setSonTaslakId] = useState<string | number | null>(null);

  const downloadRef = useRef<HTMLDivElement>(null);
  const waDownloadRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const desktopSahneRef = useRef<HTMLDivElement>(null);
  const adim2Ref = useRef<(() => void) | undefined>(undefined);
  const [desktopZoom, setDesktopZoom] = useState(0.72);
  const [captureSnapshot, setCaptureSnapshot] = useState<{
    form: FormData;
    sablon: SablonTuru;
    mode: VeliPreviewMode;
  } | null>(null);
  const captureResolveFn = useRef<(() => void) | null>(null);
  const veliModulLoglandi = useRef(false);

  const logoGelistirmeAcik =
    import.meta.env.DEV ||
    (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("modul") === "logo");

  useEffect(() => {
    let cancelled = false;
    const safety = window.setTimeout(() => {
      if (!cancelled) setKullanici(null);
    }, 20_000);

    api.me()
      .then((r) => {
        if (!cancelled) setKullanici(r.user);
      })
      .catch(() => {
        if (!cancelled) setKullanici(null);
      })
      .finally(() => clearTimeout(safety));

    return () => {
      cancelled = true;
      clearTimeout(safety);
    };
  }, []);

  useEffect(() => {
    if (homeModu === "veli" && kullanici?.id && !veliModulLoglandi.current) {
      veliModulLoglandi.current = true;
      void api.activityLog("open_veli_module").catch(() => {});
    }
  }, [homeModu, kullanici?.id]);

  useEffect(() => {
    if (homeModu !== "veli") return;
    try {
      localStorage.setItem(
        "veli_wizard_draft",
        JSON.stringify({ form, seciliSablon, activeStep, metinDuzenlendi, savedAt: new Date().toISOString() }),
      );
    } catch {
      /* localStorage kapalı */
    }
  }, [form, seciliSablon, activeStep, metinDuzenlendi, homeModu]);

  useEffect(() => {
    setFormAdim(activeStep <= 1 ? 1 : 2);
  }, [activeStep]);

  const wizardIleri = () => {
    if (activeStep >= VELI_WIZARD_LAST_STEP) return;
    const { missing } = validateVeliWizardStep(activeStep, form);
    if (missing.length > 0) {
      setStepUyari(`Eksik alanlar: ${missing.join(", ")} (yine de devam edebilirsiniz)`);
    } else {
      setStepUyari(null);
    }
    setActiveStep((s) => Math.min(s + 1, VELI_WIZARD_LAST_STEP));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const wizardGeri = () => {
    if (activeStep <= 0) return;
    setStepUyari(null);
    setActiveStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (logoGelistirmeAcik && kullanici && new URLSearchParams(window.location.search).get("modul") === "logo") {
      setHomeModu("logo");
    }
  }, [kullanici, logoGelistirmeAcik]);

  useEffect(() => {
    if (captureSnapshot && captureResolveFn.current) {
      const resolve = captureResolveFn.current;
      captureResolveFn.current = null;
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }
  }, [captureSnapshot]);

  const yeniMetinUret = useCallback(() => {
    setForm((prev) => ({ ...prev, posterMetni: aciklamaolustur(prev) }));
  }, []);

  useEffect(() => {
    if (!metinDuzenlendi) {
      setForm((prev) => ({ ...prev, posterMetni: aciklamaolustur(prev) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.faaliyetSayisi, form.ekNot, form.metinUzunlugu, metinDuzenlendi, JSON.stringify(form.faaliyetler)]);

  const posterPngYakala = async (mode: VeliPreviewMode = "normal"): Promise<string | null> => {
    await new Promise<void>((resolve) => {
      captureResolveFn.current = resolve;
      setCaptureSnapshot({ form, sablon: seciliSablon, mode });
    });

    const targetRef = mode === "whatsapp" ? waDownloadRef : downloadRef;
    if (!targetRef.current) {
      setCaptureSnapshot(null);
      return null;
    }

    try {
      const canvas = await html2canvas(targetRef.current, {
        scale: mode === "whatsapp" ? 1 : 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: mode === "whatsapp" ? "#0f172a" : "#ffffff",
        logging: false,
        width: mode === "whatsapp" ? VELI_WA_POSTER_W : undefined,
        height: mode === "whatsapp" ? VELI_WA_POSTER_H : undefined,
      });
      setCaptureSnapshot(null);
      return canvas.toDataURL("image/png");
    } catch {
      setCaptureSnapshot(null);
      return null;
    }
  };

  const aktiviteKaydet = (action: string) => {
    void api.activityLog(action).catch(() => {});
  };

  const backendEvent = useCallback((eventType: string, metadata?: Record<string, unknown>) => {
    if (eventType === "poster_saved" || eventType === "poster_downloaded" || eventType === "image_uploaded") {
      void api.activityLog(eventType).catch(() => {});
    }
    void backendApi.usageEvent(eventType, {
      source: "veli_bilgilendirme",
      template: seciliSablon,
      ...metadata,
    }).catch(() => {});
  }, [seciliSablon]);

  const taslakVerisi = useCallback((): PosterDraftData => ({
    source: "veli_bilgilendirme",
    app: "nehari_veli_bilgilendirme",
    form,
    seciliSablon,
    metinDuzenlendi,
    savedAt: new Date().toISOString(),
  }), [form, metinDuzenlendi, seciliSablon]);

  const taslakHatasi = (err: unknown) => {
    const mesaj = err instanceof Error && err.message
      ? err.message
      : "Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.";
    toast.error(mesaj);
  };

  const taslakKaydet = async () => {
    setTaslakIslem("kaydet");
    try {
      const record = await backendApi.savePosterDraft(taslakVerisi(), sonTaslakId);
      setSonTaslakId(record.id);
      backendEvent("poster_saved");
      toast.success("Taslak kaydedildi.");
    } catch (err) {
      taslakHatasi(err);
    } finally {
      setTaslakIslem(null);
    }
  };

  const sonTaslagiYukle = async () => {
    setTaslakIslem("yukle");
    try {
      const record = await backendApi.latestPosterDraft();
      if (!record || !isPosterDraftData(record.data)) {
        toast.info("Kayıtlı taslak bulunamadı.");
        return;
      }
      setForm(record.data.form);
      setSeciliSablon(record.data.seciliSablon);
      setMetinDuzenlendi(record.data.metinDuzenlendi);
      setSonTaslakId(record.id);
      toast.success("Son taslak yüklendi.");
    } catch (err) {
      taslakHatasi(err);
    } finally {
      setTaslakIslem(null);
    }
  };

  const taslakSil = async () => {
    setTaslakIslem("sil");
    try {
      const recordId = sonTaslakId || (await backendApi.latestPosterDraft())?.id;
      if (!recordId) {
        toast.info("Silinecek taslak bulunamadı.");
        return;
      }
      await backendApi.deleteRecord(recordId);
      setSonTaslakId(null);
      toast.success("Taslak silindi.");
    } catch (err) {
      taslakHatasi(err);
    } finally {
      setTaslakIslem(null);
    }
  };

  const afisiIndir = async () => {
    setIndiriliyor(true);
    try {
      const dataUrl = await posterPngYakala("normal");
      if (!dataUrl) return;
      aktiviteKaydet("export_png");
      backendEvent("poster_downloaded", { format: "png" });

      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        window.open(dataUrl, "_blank");
      } else {
        const link = document.createElement("a");
        link.download = `nehari-veli-bilgilendirme-${seciliSablon}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setIndiriliyor(false);
    }
  };

  const pdfIndir = async () => {
    setPdfYukleniyor(true);
    try {
      const dataUrl = await posterPngYakala("normal");
      if (!dataUrl) return;

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const imgW = pdfW - margin * 2;
      const imgH = (imgW * POSTER_H) / POSTER_W;
      const finalH = Math.min(imgH, pdfH - margin * 2);
      const y = (pdfH - finalH) / 2;

      pdf.addImage(dataUrl, "PNG", margin, y, imgW, finalH);
      pdf.save(`nehari-veli-bilgilendirme-${seciliSablon}.pdf`);
      aktiviteKaydet("export_pdf");
      backendEvent("poster_downloaded", { format: "pdf" });
    } finally {
      setPdfYukleniyor(false);
    }
  };

  const whatsappMetniKopyala = async () => {
    const metin = veliWhatsappMesajiOlustur(form);
    try {
      await navigator.clipboard.writeText(metin);
      toast.success("WhatsApp metni kopyalandı.");
    } catch {
      toast.error("Metin kopyalanamadı. Lütfen tekrar deneyin.");
    }
  };

  const whatsappGorselIndir = async () => {
    setWaGorselIndiriliyor(true);
    try {
      const dataUrl = await posterPngYakala("whatsapp");
      if (!dataUrl) {
        toast.error("WhatsApp görseli oluşturulamadı.");
        return;
      }
      aktiviteKaydet("export_whatsapp_image");
      backendEvent("poster_downloaded", { format: "whatsapp_png" });

      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        window.open(dataUrl, "_blank");
      } else {
        const link = document.createElement("a");
        link.download = `nehari-whatsapp-${seciliSablon}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast.success("WhatsApp görseli indirildi (1080×1350).");
    } finally {
      setWaGorselIndiriliyor(false);
    }
  };

  const whatsappPaylas = async () => {
    setWaPaylasiliyor(true);
    const metin = veliWhatsappMesajiOlustur(form);

    try {
      const dataUrl = await posterPngYakala("whatsapp");
      if (!dataUrl) {
        toast.error("WhatsApp görseli oluşturulamadı.");
        return;
      }

      try {
        await navigator.clipboard.writeText(metin);
      } catch {
        /* clipboard optional */
      }

      if (navigator.share) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], "veli-bilgilendirme-whatsapp.png", { type: "image/png" });
          if (navigator.canShare({ files: [file], text: metin })) {
            await navigator.share({
              files: [file],
              title: "Veli Bilgilendirme",
              text: metin,
            });
            aktiviteKaydet("share_whatsapp");
            backendEvent("poster_downloaded", { format: "whatsapp_share" });
            toast.success("Paylaşım açıldı. Metin panoya da kopyalandı.");
            return;
          }
        } catch {
          /* fall through */
        }
      }

      const link = document.createElement("a");
      link.download = `nehari-whatsapp-${seciliSablon}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.open(`https://wa.me/?text=${encodeURIComponent(metin)}`, "_blank");
      aktiviteKaydet("share_whatsapp");
      toast.info("WhatsApp görseli indirildi ve metin panoya kopyalandı. Sohbete görseli ekleyip metni yapıştırabilirsiniz.");
    } finally {
      setWaPaylasiliyor(false);
    }
  };

  const cikisYap = useCallback(async () => {
    await api.cikisYap();
    setKullanici(null);
    setForm(baslangicForm);
    setMetinDuzenlendi(false);
    setAktifSekme("form");
    setHomeModu("kategoriler");
  }, []);

  if (kullanici === undefined) {
    return (
      <div
        style={{
          height: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #2563eb 100%)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              border: "4px solid rgba(255,255,255,0.2)",
              borderTopColor: "#fff",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600 }}>Yükleniyor...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (kullanici === null) {
    return (
      <GirisEkrani
        onGiris={(k) => {
          setKullanici(k);
          setHomeModu("kategoriler");
        }}
      />
    );
  }

  if (homeModu === "kategoriler") {
    const adminMi = kullaniciAdminMi(kullanici);
    return (
      <>
        <Toaster position="top-center" richColors />
        <CategoryHome
          kullaniciAdi={kullanici.name}
          isAdmin={adminMi}
          onVeliBilgilendirme={() => setHomeModu("veli")}
          onYakinda={(modulAdi) => {
            toast.info(`${modulAdi} modülü hazırlanıyor.`);
          }}
          onDestek={() => setDestekAcik(true)}
          onYonetim={() => {
            setHomeModu("veli");
            setAktifSekme("yonetim");
          }}
          onCikis={cikisYap}
        />
        {destekAcik && <DestekModal onKapat={() => setDestekAcik(false)} kullanici={kullanici} />}
      </>
    );
  }

  if (homeModu === "yatili" && kullanici) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <KolayAfisModulu
          kullanici={kullanici}
          onAnaSayfa={() => setHomeModu("kategoriler")}
          onDestek={() => setDestekAcik(true)}
          onCikis={cikisYap}
        />
        {destekAcik && <DestekModal onKapat={() => setDestekAcik(false)} kullanici={kullanici} />}
      </>
    );
  }

  if (homeModu === "logo" && kullanici) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <Suspense
          fallback={
            <div className="flex min-h-dvh items-center justify-center bg-slate-100 text-sm font-semibold text-slate-600">
              Logo modülü yükleniyor…
            </div>
          }
        >
          <KurumsalKimlikModulu
            kullanici={kullanici}
            onAnaSayfa={() => setHomeModu("kategoriler")}
            onDestek={() => setDestekAcik(true)}
            onCikis={cikisYap}
          />
        </Suspense>
        {destekAcik && <DestekModal onKapat={() => setDestekAcik(false)} kullanici={kullanici} />}
      </>
    );
  }

  if (homeModu === "deneme" && kullanici) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <DenemeSinaviModulu
          kullanici={kullanici}
          onAnaSayfa={() => setHomeModu("kategoriler")}
          onDestek={() => setDestekAcik(true)}
          onYonetim={() => {
            setHomeModu("veli");
            setAktifSekme("yonetim");
          }}
          onCikis={cikisYap}
        />
        {destekAcik && <DestekModal onKapat={() => setDestekAcik(false)} kullanici={kullanici} />}
      </>
    );
  }

  const paylasBtnStil = (gradient: string, disabled?: boolean): React.CSSProperties => ({
    flex: "1 1 calc(33% - 6px)",
    minWidth: 0,
    padding: "11px 8px",
    borderRadius: 14,
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
    border: "none",
    cursor: disabled ? "wait" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    background: gradient,
    boxShadow: disabled ? "none" : "0 6px 18px rgba(15,23,42,0.15)",
    opacity: disabled ? 0.75 : 1,
    transition: "transform 0.12s ease, opacity 0.15s",
  });

  const draftBtnStil = (aktif: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "8px 9px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: aktif ? "#e0e7ff" : "#ffffff",
    color: aktif ? "#1d4ed8" : "#475569",
    fontSize: 11,
    fontWeight: 800,
    cursor: aktif ? "wait" : "pointer",
  });

  const PaylasCiktiBtnlari = () => (
    <div className="veli-export-actions">
      <button
        type="button"
        onClick={afisiIndir}
        disabled={indiriliyor}
        style={paylasBtnStil("linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", indiriliyor)}
      >
        {indiriliyor ? "…" : "Normal PNG"}
      </button>
      <button
        type="button"
        onClick={pdfIndir}
        disabled={pdfYukleniyor}
        style={paylasBtnStil("linear-gradient(135deg, #dc2626 0%, #ef4444 100%)", pdfYukleniyor)}
      >
        {pdfYukleniyor ? "…" : "PDF"}
      </button>
      <button
        type="button"
        onClick={() => void whatsappGorselIndir()}
        disabled={waGorselIndiriliyor}
        style={paylasBtnStil("linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)", waGorselIndiriliyor)}
      >
        {waGorselIndiriliyor ? "…" : "WhatsApp Görseli"}
      </button>
      <button
        type="button"
        onClick={() => void whatsappMetniKopyala()}
        style={paylasBtnStil("linear-gradient(135deg, #475569 0%, #64748b 100%)")}
      >
        WhatsApp Metni
      </button>
      <button
        type="button"
        onClick={() => void whatsappPaylas()}
        disabled={waPaylasiliyor}
        style={paylasBtnStil("linear-gradient(135deg, #15803d 0%, #22c55e 100%)", waPaylasiliyor)}
      >
        {waPaylasiliyor ? "…" : "WA Paylaş"}
      </button>
    </div>
  );

  const previewArtboardW = previewMode === "whatsapp" ? VELI_WA_POSTER_W : POSTER_W;
  const previewArtboardH = previewMode === "whatsapp" ? VELI_WA_POSTER_H : POSTER_H;

  const TaslakMenu = () => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setTaslakMenuAcik((v) => !v)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
      >
        Taslak ▾
      </button>
      {taslakMenuAcik && (
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[11rem] rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          <button type="button" onClick={() => { void taslakKaydet(); setTaslakMenuAcik(false); }} disabled={Boolean(taslakIslem)} className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">Kaydet</button>
          <button type="button" onClick={() => { void sonTaslagiYukle(); setTaslakMenuAcik(false); }} disabled={Boolean(taslakIslem)} className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50">Son taslağı yükle</button>
          <button type="button" onClick={() => { void taslakSil(); setTaslakMenuAcik(false); }} disabled={Boolean(taslakIslem)} className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50">Sil</button>
        </div>
      )}
    </div>
  );

  const desktopKalite = veliKaliteKontrol(form, seciliSablon);
  const desktopSablonAd = SABLON_LISTESI.find((s) => s.id === seciliSablon)?.ad ?? seciliSablon;
  const desktopKaliteEtiket =
    desktopKalite.durum === "hazir" ? "Hazır" : desktopKalite.durum === "dikkat" ? "Dikkat" : "Eksik";

  return (
    <div className="veli-app-shell flex flex-col overflow-x-hidden" style={{ height: "100dvh", background: "#f1f5f9" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Toaster position="top-center" richColors />

      <header
        className={`tedris-app-header flex-shrink-0${aktifSekme === "yonetim" ? " tedris-app-header--admin" : ""}${aktifSekme === "form" ? " tedris-app-header--veli-compact" : ""}`}
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2563eb 100%)",
        }}
      >
        <div className="tedris-app-header__toolbar">
          <div className="tedris-app-header__start">
            <button
              type="button"
              onClick={() => {
                setHomeModu("kategoriler");
                setAktifSekme("form");
              }}
              className="tedris-app-header__back flex shrink-0 items-center gap-1 rounded-xl border border-white/25 bg-white/10 px-2.5 py-2 text-[11px] font-bold text-white/95 transition hover:bg-white/20 md:gap-1.5 md:px-3 md:text-xs"
              title="Kategori seçim ekranına dön"
            >
              <svg className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="tedris-app-header__back-label">Ana sayfaya dön</span>
            </button>

            <div className="tedris-app-header__brand-desktop hidden md:flex min-w-0">
              <AppBrand kullaniciAdi={kullanici.name} />
            </div>
          </div>

          <div className="tedris-app-header__actions">
            <button
              type="button"
              onClick={() => setDestekAcik(true)}
              className="tedris-header-icon-btn"
              title="Destek"
            >
              <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </button>

            {kullaniciAdminMi(kullanici) && (
              <button
                type="button"
                onClick={() => setAktifSekme("yonetim")}
                className={`tedris-header-pill-btn${aktifSekme === "yonetim" ? " is-active" : ""}`}
                title="Yönetim"
              >
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z"
                  />
                </svg>
                <span className="tedris-header-pill-btn__label">Yönetim</span>
              </button>
            )}

            <button
              type="button"
              onClick={cikisYap}
              className="tedris-header-pill-btn tedris-header-pill-btn--muted"
              title="Çıkış"
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="tedris-header-pill-btn__label">Çıkış</span>
            </button>
          </div>
        </div>

        <div className="tedris-app-header__brand-mobile md:hidden">
          <AppBrand kullaniciAdi={kullanici.name} mobilSatir />
        </div>
      </header>

      <div className={`veli-desktop-workspace ${aktifSekme === "yonetim" ? "" : "veli-desktop-workspace--veli"} hidden lg:flex flex-1 min-h-0`}>
        {aktifSekme === "yonetim" && kullaniciAdminMi(kullanici) ? (
          <div className="veli-desktop-inner veli-admin-desktop-inner w-full">
            <AdminSayfasi />
          </div>
        ) : (
          <div className="veli-desktop-inner w-full mx-auto">
            <div className="veli-studio-shell">
              <header className="veli-studio-toolbar">
                <div className="veli-studio-toolbar__brand">
                  <h2 className="veli-studio-toolbar__title">Veli Bilgilendirme Oluştur</h2>
                  <p className="veli-studio-toolbar__desc">
                    Bilgileri doldurun, tasarımı seçin, önizleyip indirin.
                  </p>
                </div>
                <div className="veli-studio-toolbar__meta">
                  <TaslakMenu />
                  <span className="veli-desktop-pill">
                    <span className="veli-desktop-pill__label">Adım</span>
                    {activeStep + 1}/{VELI_WIZARD_STEPS.length} · {VELI_WIZARD_STEPS[activeStep]?.title}
                  </span>
                  <span className="veli-desktop-pill">
                    <span className="veli-desktop-pill__label">Şablon</span>
                    {desktopSablonAd}
                  </span>
                  <span className={`veli-desktop-pill veli-desktop-pill--${desktopKalite.durum}`}>
                    <span className="veli-desktop-pill__label">Kalite</span>
                    {desktopKaliteEtiket}
                  </span>
                </div>
                <span className="veli-studio-toolbar__live">Önizleme canlı güncellenir</span>
              </header>

              <div className="veli-studio-workspace">
                <div className="veli-desktop-form-col">
                  <div className="veli-desktop-form-shell">
                    <FormAlani
                      form={form}
                      setForm={setForm}
                      seciliSablon={seciliSablon}
                      setSeciliSablon={setSeciliSablon}
                      onMetinYenile={yeniMetinUret}
                      setMetinDuzenlendi={setMetinDuzenlendi}
                      kullaniciId={kullanici.id}
                      adim2Ref={adim2Ref}
                      desktopMod
                      activeStep={activeStep}
                      onActiveStepChange={(s) => { setStepUyari(null); setActiveStep(s); }}
                      stepUyari={stepUyari}
                      onTaslakKaydet={() => void taslakKaydet()}
                      taslakKaydediliyor={taslakIslem === "kaydet"}
                      onWizardIleri={wizardIleri}
                      onWizardGeri={wizardGeri}
                      onGorselYuklendi={(adet) => backendEvent("image_uploaded", { count: adet })}
                    />
                  </div>
                </div>

                <div className="veli-desktop-preview-col">
                  <PreviewModeToggle mode={previewMode} onChange={setPreviewMode} />
                  <PreviewPanel
                    stageRef={desktopSahneRef}
                    zoomLabel={`${Math.round(desktopZoom * 100)}%`}
                    hint={previewMode === "whatsapp" ? "1080×1350 WhatsApp paylaşım görseli — sohbette daha okunur" : undefined}
                  >
                    <VeliPreviewScaler
                      observeRef={desktopSahneRef}
                      padding={12}
                      frameClassName="veli-studio-poster-wrap"
                      artboardWidth={previewArtboardW}
                      artboardHeight={previewArtboardH}
                      onScaleChange={setDesktopZoom}
                      deps={[form, seciliSablon, previewMode]}
                    >
                      <VeliOnizlemeIcerik form={form} sablon={seciliSablon} mode={previewMode} />
                    </VeliPreviewScaler>
                  </PreviewPanel>
                  {activeStep === VELI_WIZARD_LAST_STEP ? (
                    <>
                      <QualityPanel form={form} seciliSablon={seciliSablon} full />
                      <WhatsAppQualityPanel form={form} />
                      <div className="veli-studio-actions veli-studio-actions--exports">
                        <PaylasCiktiBtnlari />
                      </div>
                    </>
                  ) : (
                    <QualityPanel form={form} seciliSablon={seciliSablon} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="lg:hidden flex-1 overflow-hidden flex flex-col">
        {aktifSekme === "form" && activeStep < VELI_WIZARD_LAST_STEP && (
          <div className="flex-1 overflow-y-auto" style={{ background: "#f8fafc" }}>
            <div className="veli-wizard-mobile-content p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-800">Veli Bilgilendirme</p>
                <TaslakMenu />
              </div>
              {activeStep >= 1 && activeStep < VELI_WIZARD_LAST_STEP && (
                <button
                  type="button"
                  onClick={() => setMobilOnizlemeAcik(true)}
                  className="mb-3 w-full rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-sm font-bold text-blue-700"
                >
                  Önizlemeyi Aç
                </button>
              )}
              <FormAlani
                form={form}
                setForm={setForm}
                seciliSablon={seciliSablon}
                setSeciliSablon={setSeciliSablon}
                onMetinYenile={yeniMetinUret}
                setMetinDuzenlendi={setMetinDuzenlendi}
                kullaniciId={kullanici.id}
                adim2Ref={adim2Ref}
                mobilMod
                activeStep={activeStep}
                onActiveStepChange={(s) => { setStepUyari(null); setActiveStep(s); }}
                stepUyari={stepUyari}
                onWizardIleri={wizardIleri}
                onWizardGeri={wizardGeri}
                onGorselYuklendi={(adet) => backendEvent("image_uploaded", { count: adet })}
              />
            </div>
          </div>
        )}

        {aktifSekme === "form" && activeStep === VELI_WIZARD_LAST_STEP && (
          <div className="veli-wizard-mobile-content flex-1 overflow-y-auto" style={{ background: "#f8fafc" }}>
            <div className="p-4 space-y-4">
              <PreviewModeToggle mode={previewMode} onChange={setPreviewMode} compact />
              <QualityPanel form={form} seciliSablon={seciliSablon} full />
              <WhatsAppQualityPanel form={form} />
              <VeliOnizlemeMobil
                form={form}
                sablon={seciliSablon}
                wrapperRef={wrapperRef}
                onSablonOner={setSeciliSablon}
                previewMode={previewMode}
              />
            </div>
          </div>
        )}

        {mobilOnizlemeAcik && activeStep < VELI_WIZARD_LAST_STEP && (
          <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 p-3 backdrop-blur-sm">
            <div className="mx-auto flex h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <strong className="text-sm text-slate-800">Önizleme</strong>
                <button type="button" onClick={() => setMobilOnizlemeAcik(false)} className="text-sm font-bold text-blue-600">Kapat</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <VeliOnizlemeMobil form={form} sablon={seciliSablon} wrapperRef={wrapperRef} onSablonOner={setSeciliSablon} compact />
              </div>
            </div>
          </div>
        )}

        {aktifSekme === "yonetim" && kullaniciAdminMi(kullanici) && (
          <div className="flex-1 overflow-y-auto" style={{ background: "#f1f5f9" }}>
            <AdminSayfasi />
          </div>
        )}

        {aktifSekme === "form" && (
          <BottomActionBar
            hasBack={activeStep > 0}
            left={
              activeStep > 0 ? (
                <button type="button" onClick={wizardGeri} className="veli-wizard-bottom-bar__btn veli-wizard-bottom-bar__btn--secondary">
                  Geri
                </button>
              ) : null
            }
            center={
              activeStep < VELI_WIZARD_LAST_STEP ? (
                <button
                  type="button"
                  onClick={() => void taslakKaydet()}
                  disabled={Boolean(taslakIslem)}
                  className="veli-wizard-bottom-bar__btn veli-wizard-bottom-bar__btn--secondary"
                >
                  Kaydet
                </button>
              ) : null
            }
            right={
              activeStep < VELI_WIZARD_LAST_STEP ? (
                <button type="button" onClick={wizardIleri} className="veli-wizard-bottom-bar__btn veli-wizard-bottom-bar__btn--primary">
                  Devam Et
                </button>
              ) : (
                <div className="veli-wizard-bottom-bar__exports veli-wizard-bottom-bar__exports--full">
                  <button type="button" onClick={afisiIndir} disabled={indiriliyor} className="veli-wizard-bottom-bar__btn veli-wizard-bottom-bar__btn--primary veli-wizard-bottom-bar__btn--compact">PNG</button>
                  <button type="button" onClick={pdfIndir} disabled={pdfYukleniyor} className="veli-wizard-bottom-bar__btn veli-wizard-bottom-bar__btn--danger veli-wizard-bottom-bar__btn--compact">PDF</button>
                  <button type="button" onClick={() => void whatsappGorselIndir()} disabled={waGorselIndiriliyor} className="veli-wizard-bottom-bar__btn veli-wizard-bottom-bar__btn--teal veli-wizard-bottom-bar__btn--compact">WA Görsel</button>
                  <button type="button" onClick={() => void whatsappMetniKopyala()} className="veli-wizard-bottom-bar__btn veli-wizard-bottom-bar__btn--secondary veli-wizard-bottom-bar__btn--compact">WA Metin</button>
                  <button type="button" onClick={() => void whatsappPaylas()} disabled={waPaylasiliyor} className="veli-wizard-bottom-bar__btn veli-wizard-bottom-bar__btn--success veli-wizard-bottom-bar__btn--compact">Paylaş</button>
                </div>
              )
            }
          />
        )}
      </div>

      {captureSnapshot && (
        <div style={{ position: "absolute", top: -9999, left: 0, pointerEvents: "none" }}>
          <VeliOnizlemeIcerik
            form={captureSnapshot.form}
            sablon={captureSnapshot.sablon}
            mode={captureSnapshot.mode}
            artboardRef={captureSnapshot.mode === "whatsapp" ? waDownloadRef : downloadRef}
          />
        </div>
      )}

      {aktifSekme === "yonetim" && (
        <VeliMobilNav
          aktifSekme={aktifSekme}
          onSekme={(sekme) => {
            setAktifSekme(sekme);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          adminGoster={kullaniciAdminMi(kullanici)}
          onDestek={() => setDestekAcik(true)}
        />
      )}

      {destekAcik && <DestekModal onKapat={() => setDestekAcik(false)} kullanici={kullanici} />}
    </div>
  );
}

export default function App() {
  const [davetAktif, setDavetAktif] = useState(isDavetPathname);

  useEffect(() => {
    const sync = () => setDavetAktif(isDavetPathname());
    window.addEventListener("popstate", sync);
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      origPush(...args);
      sync();
    };
    history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
      origReplace(...args);
      sync();
    };
    return () => {
      window.removeEventListener("popstate", sync);
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }, []);

  if (davetAktif) {
    return (
      <DavetProviders>
        <DavetRouter />
      </DavetProviders>
    );
  }

  return <MainApp />;
}
