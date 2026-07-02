import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import { Toaster, toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { FormData, SablonTuru } from "./types";
import { aciklamaolustur } from "./lib/dil";
import { api, kullaniciAdminMi, kullaniciRaporGorebilirMi, type KullaniciBilgisi } from "./lib/api";
import { backendApi, type PosterDraftData } from "./lib/backendApi";
import FormAlani from "./components/FormAlani";
import { VeliOnizlemeIcerik } from "./components/veli/VeliOnizlemeIcerik";
import { VeliMobilNav } from "./components/veli/VeliMobilNav";
import { VeliOnizlemeMobil } from "./components/veli/VeliOnizlemeMobil";
import { SABLON_LISTESI } from "./lib/sablonlar";
import { veliKaliteKontrol } from "./lib/veli/veliKaliteKontrol";
import { validateVeliWizardStep, VELI_WIZARD_STEPS, VELI_WIZARD_LAST_STEP } from "./lib/veli/veliWizardSteps";
import { PreviewPanel } from "./components/veli/wizard/PreviewPanel";
import { QualityPanel } from "./components/veli/wizard/QualityPanel";
import { BottomActionBar } from "./components/veli/wizard/BottomActionBar";
import GirisEkrani from "./components/GirisEkrani";
import DestekModal from "./components/DestekModal";
import AdminSayfasi from "./components/AdminSayfasi";
import { VELI_POSTER_H, VELI_POSTER_W } from "./lib/sablonlar/posterShell";
import { AppBrand } from "./components/AppBrand";
import { CategoryHome } from "./components/ana-giris/CategoryHome";
import { DenemeSinaviModulu } from "./components/deneme/DenemeSinaviModulu";
import { KolayAfisModulu } from "./components/kolay-afis/KolayAfisModulu";
import { DavetProviders } from "./modules/davet/DavetProviders";
import { DavetRouter } from "./modules/davet/DavetRouter";
import { goToAppHome } from "./modules/davet/layout/navRoutes";

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

const VELI_WIZARD_DRAFT_KEY = "veli_wizard_draft";
const VELI_WIZARD_DRAFT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

interface LocalVeliWizardDraft {
  form: FormData;
  seciliSablon: SablonTuru;
  activeStep: number;
  metinDuzenlendi: boolean;
  savedAt: string;
}

function sablonTuruMu(value: unknown): value is SablonTuru {
  return typeof value === "string" && SABLON_LISTESI.some((s) => s.id === value);
}

function normalizeLocalFormDraft(value: unknown): FormData | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<FormData>;
  return {
    ...baslangicForm,
    ...raw,
    kurumAdi: typeof raw.kurumAdi === "string" ? raw.kurumAdi : "",
    isim: typeof raw.isim === "string" ? raw.isim : "",
    rol: typeof raw.rol === "string" ? raw.rol : "",
    faaliyetSayisi: typeof raw.faaliyetSayisi === "number" ? raw.faaliyetSayisi : baslangicForm.faaliyetSayisi,
    faaliyetler: Array.isArray(raw.faaliyetler)
      ? raw.faaliyetler.map((f) => ({
          tur: typeof f?.tur === "string" ? f.tur : "",
          alan: typeof f?.alan === "string" ? f.alan : "",
          ozelNot: typeof f?.ozelNot === "string" ? f.ozelNot : "",
        }))
      : baslangicForm.faaliyetler,
    metinUzunlugu: raw.metinUzunlugu === "kisa" || raw.metinUzunlugu === "detayli" ? raw.metinUzunlugu : baslangicForm.metinUzunlugu,
    posterMetni: typeof raw.posterMetni === "string" ? raw.posterMetni : "",
    ekNot: typeof raw.ekNot === "string" ? raw.ekNot : "",
    gorseller: Array.isArray(raw.gorseller) ? raw.gorseller.filter((g): g is string => typeof g === "string") : [],
    seciliBaslikIdx: typeof raw.seciliBaslikIdx === "number" ? raw.seciliBaslikIdx : 0,
  };
}

function formdaKullaniciVerisiVar(form: FormData, activeStep: number, seciliSablon: SablonTuru, metinDuzenlendi: boolean): boolean {
  return Boolean(
    activeStep > 0 ||
      seciliSablon !== "akademik" ||
      metinDuzenlendi ||
      form.kurumAdi.trim() ||
      form.isim.trim() ||
      form.rol.trim() ||
      form.ekNot.trim() ||
      form.gorseller.length > 0 ||
      form.faaliyetler.some((f) => f.tur.trim() || f.alan.trim() || f.ozelNot.trim()),
  );
}

function readLocalVeliWizardDraft(): LocalVeliWizardDraft | null {
  try {
    const raw = localStorage.getItem(VELI_WIZARD_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalVeliWizardDraft>;
    const form = normalizeLocalFormDraft(parsed.form);
    if (!form || !sablonTuruMu(parsed.seciliSablon)) return null;
    if (parsed.savedAt && Date.now() - Date.parse(parsed.savedAt) > VELI_WIZARD_DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(VELI_WIZARD_DRAFT_KEY);
      return null;
    }
    return {
      form,
      seciliSablon: parsed.seciliSablon,
      activeStep: Math.min(Math.max(Number(parsed.activeStep) || 0, 0), VELI_WIZARD_LAST_STEP),
      metinDuzenlendi: Boolean(parsed.metinDuzenlendi),
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function clearLocalVeliWizardDraft() {
  try {
    localStorage.removeItem(VELI_WIZARD_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

function isPosterDraftData(data: unknown): data is PosterDraftData {
  const d = data as Partial<PosterDraftData> | null;
  return Boolean(d && typeof d === "object" && d.form && typeof d.seciliSablon === "string");
}

async function waitForImages(node: HTMLElement): Promise<void> {
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }

          let timeoutId = 0;
          const done = () => {
            window.clearTimeout(timeoutId);
            img.removeEventListener("load", done);
            img.removeEventListener("error", done);
            resolve();
          };

          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          timeoutId = window.setTimeout(done, 3000);

          if (typeof img.decode === "function") {
            img.decode().then(done).catch(() => {
              if (img.complete) done();
            });
          }
        }),
    ),
  );
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const desktopSahneRef = useRef<HTMLDivElement>(null);
  const adim2Ref = useRef<(() => void) | undefined>(undefined);
  const [zoom, setZoom] = useState(1);
  const [desktopZoom, setDesktopZoom] = useState(0.72);
  const [captureSnapshot, setCaptureSnapshot] = useState<{ form: FormData; sablon: SablonTuru } | null>(null);
  const captureResolveFn = useRef<(() => void) | null>(null);
  const veliModulLoglandi = useRef(false);
  const localTaslakKontrolEdildi = useRef(false);
  const localTaslakYuklemeKaydiAtla = useRef(false);

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
    if (homeModu !== "veli" || localTaslakKontrolEdildi.current) return;
    localTaslakKontrolEdildi.current = true;
    const draft = readLocalVeliWizardDraft();
    if (!draft || !formdaKullaniciVerisiVar(draft.form, draft.activeStep, draft.seciliSablon, draft.metinDuzenlendi)) return;
    localTaslakYuklemeKaydiAtla.current = true;
    setForm(draft.form);
    setSeciliSablon(draft.seciliSablon);
    setActiveStep(draft.activeStep);
    setMetinDuzenlendi(draft.metinDuzenlendi);
    toast.info("Kaldığınız afiş taslağı geri yüklendi.");
  }, [homeModu]);

  useEffect(() => {
    if (homeModu !== "veli") return;
    if (localTaslakYuklemeKaydiAtla.current) {
      localTaslakYuklemeKaydiAtla.current = false;
      return;
    }
    try {
      if (formdaKullaniciVerisiVar(form, activeStep, seciliSablon, metinDuzenlendi)) {
        localStorage.setItem(
          VELI_WIZARD_DRAFT_KEY,
          JSON.stringify({ form, seciliSablon, activeStep, metinDuzenlendi, savedAt: new Date().toISOString() }),
        );
      } else {
        localStorage.removeItem(VELI_WIZARD_DRAFT_KEY);
      }
    } catch {
      /* localStorage kapalı */
    }
  }, [form, seciliSablon, activeStep, metinDuzenlendi, homeModu]);

  const formdaKaydedilecekVeriVar = homeModu === "veli" && formdaKullaniciVerisiVar(form, activeStep, seciliSablon, metinDuzenlendi);

  useEffect(() => {
    if (!formdaKaydedilecekVeriVar) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [formdaKaydedilecekVeriVar]);

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

  // Derin bağlantı: /davet anasayfasından ?modul=veli ile doğrudan Veli Bilgilendirme aç
  useEffect(() => {
    if (kullanici && new URLSearchParams(window.location.search).get("modul") === "veli") {
      setHomeModu("veli");
    }
  }, [kullanici]);

  // Derin bağlantı: ?modul=yonetim ile doğrudan Yönetim sekmesi aç (sadece admin)
  useEffect(() => {
    if (kullanici && kullaniciRaporGorebilirMi(kullanici) && new URLSearchParams(window.location.search).get("modul") === "yonetim") {
      setHomeModu("veli");
      setAktifSekme("yonetim");
    }
  }, [kullanici]);

  useEffect(() => {
    function hesapla() {
      if (!wrapperRef.current) return;
      // clientWidth includes the frame's 8px padding on each side → subtract to get usable inner width
      const usableW = Math.max(100, wrapperRef.current.clientWidth - 16);
      setZoom(Math.min(1, usableW / POSTER_W));
    }
    hesapla();
    const obs = new ResizeObserver(hesapla);
    if (wrapperRef.current) obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  // mobilOnizlemeAcik ve activeStep eklenmiş: wrapperRef modal/last-step'te monte
  // edildiğinde zoom henüz hesaplanmamış olabilir; bu bağımlılıklar bunu tetikler.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktifSekme, activeStep, mobilOnizlemeAcik]);

  const desktopOlcekHesapla = useCallback(() => {
    const area = desktopSahneRef.current;
    if (!area) return;
    const pad = 12;
    const aw = Math.max(1, area.clientWidth - pad * 2);
    const ah = Math.max(1, area.clientHeight - pad * 2);
    const s = Math.min(aw / POSTER_W, ah / POSTER_H, 1);
    setDesktopZoom(s);
  }, []);

  useEffect(() => {
    desktopOlcekHesapla();
    const t1 = requestAnimationFrame(desktopOlcekHesapla);
    const t2 = window.setTimeout(desktopOlcekHesapla, 120);
    const obs = new ResizeObserver(desktopOlcekHesapla);
    if (desktopSahneRef.current) obs.observe(desktopSahneRef.current);
    return () => {
      cancelAnimationFrame(t1);
      window.clearTimeout(t2);
      obs.disconnect();
    };
  }, [desktopOlcekHesapla]);

  const desktopScaledW = Math.round(POSTER_W * desktopZoom);
  const desktopScaledH = Math.round(POSTER_H * desktopZoom);

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

  const posterPngYakala = async (): Promise<string | null> => {
    await new Promise<void>((resolve) => {
      captureResolveFn.current = resolve;
      setCaptureSnapshot({ form, sablon: seciliSablon });
    });

    const posterNode = downloadRef.current;
    if (!posterNode) {
      setCaptureSnapshot(null);
      return null;
    }

    try {
      await waitForImages(posterNode);
      const canvas = await html2canvas(posterNode, {
        scale: 2.5,
        width: POSTER_W,
        height: POSTER_H,
        windowWidth: POSTER_W,
        windowHeight: POSTER_H,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
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
        clearLocalVeliWizardDraft();
        toast.info("Silinecek taslak bulunamadı.");
        return;
      }
      await backendApi.deleteRecord(recordId);
      setSonTaslakId(null);
      clearLocalVeliWizardDraft();
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
      const dataUrl = await posterPngYakala();
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
      const dataUrl = await posterPngYakala();
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

  const whatsappPaylas = async () => {
    const metin = [
      form.kurumAdi && `📚 ${form.kurumAdi}`,
      form.posterMetni,
      form.isim && `— ${form.isim}${form.rol ? `, ${form.rol}` : ""}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    if (navigator.canShare) {
      try {
        const dataUrl = await posterPngYakala();
        if (dataUrl) {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], "afis.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: "Nehari Veli Bilgilendirme - Veli Bilgilendirme Afişi",
              text: metin,
            });
            aktiviteKaydet("share_whatsapp");
            return;
          }
        }
      } catch {}
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(metin)}`, "_blank");
    aktiviteKaydet("share_whatsapp");
  };

  const cikisYap = useCallback(async () => {
    await api.cikisYap();
    clearLocalVeliWizardDraft();
    setKullanici(null);
    setForm(baslangicForm);
    setMetinDuzenlendi(false);
    setAktifSekme("form");
    setHomeModu("kategoriler");
  }, []);

  const anaSayfayaDon = useCallback(() => {
    if (
      formdaKaydedilecekVeriVar &&
      !window.confirm("Afiş bilgileriniz bu cihazda taslak olarak saklandı. Yine de ana sayfaya dönmek istiyor musunuz?")
    ) {
      return;
    }
    goToAppHome();
  }, [formdaKaydedilecekVeriVar]);

  // ?force-logout=1 parametresi: çıkış sonrası kesin login ekranı göster.
  // Backend session hâlâ aktif olsa bile (çerez temizlenememiş) login ekranı açılır.
  const forceLogout =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("force-logout") === "1";

  if (forceLogout) {
    return (
      <GirisEkrani
        onGiris={(k) => {
          setKullanici(k);
          window.location.assign("/davet");
        }}
      />
    );
  }

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
          // Login sonrası doğrudan Nehari Çalışma Paneli'ne yönlendir
          window.location.assign("/davet");
        }}
      />
    );
  }

  if (homeModu === "kategoriler") {
    // ?modul= parametresi olmadan / adresine gelinen durumda /davet'e yönlendir
    const modul = new URLSearchParams(window.location.search).get("modul");
    if (!modul) {
      window.location.assign("/davet");
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
                width: 48,
                height: 48,
                border: "4px solid rgba(255,255,255,0.2)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600 }}>Yönlendiriliyor…</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }
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
    flex: 1,
    padding: "13px 10px",
    borderRadius: 16,
    fontSize: 13,
    fontWeight: 700,
    color: "#fff",
    border: "none",
    cursor: disabled ? "wait" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
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
    <div style={{ display: "flex", gap: 8 }}>
      <button
        onClick={afisiIndir}
        disabled={indiriliyor}
        style={paylasBtnStil("linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", indiriliyor)}
        onMouseDown={(e) => !indiriliyor && (e.currentTarget.style.transform = "scale(0.97)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
      >
        {indiriliyor ? (
          <span
            style={{
              width: 16,
              height: 16,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              display: "inline-block",
            }}
          />
        ) : (
          <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        )}
        PNG
      </button>

      <button
        onClick={pdfIndir}
        disabled={pdfYukleniyor}
        style={paylasBtnStil("linear-gradient(135deg, #dc2626 0%, #ef4444 100%)", pdfYukleniyor)}
      >
        {pdfYukleniyor ? (
          <span
            style={{
              width: 16,
              height: 16,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              display: "inline-block",
            }}
          />
        ) : (
          <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}
        PDF
      </button>

      <button
        onClick={whatsappPaylas}
        style={paylasBtnStil("linear-gradient(135deg, #15803d 0%, #22c55e 100%)")}
      >
        <svg width={16} height={16} fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
        WA
      </button>
    </div>
  );

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
        className={`tedris-app-header flex-shrink-0${aktifSekme === "yonetim" ? " tedris-app-header--admin" : ""}`}
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2563eb 100%)",
        }}
      >
        <div className="tedris-app-header__toolbar">
          <div className="tedris-app-header__start">
            <button
              type="button"
              onClick={anaSayfayaDon}
              className="tedris-app-header__back flex shrink-0 items-center gap-1 rounded-xl border border-white/25 bg-white/10 px-2.5 py-2 text-[11px] font-bold text-white/95 transition hover:bg-white/20 md:gap-1.5 md:px-3 md:text-xs"
              title="Nehari Çalışma Paneli'ne dön"
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

            {kullaniciRaporGorebilirMi(kullanici) && (
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
        {aktifSekme === "yonetim" && kullaniciRaporGorebilirMi(kullanici) ? (
          <div className="veli-desktop-inner veli-admin-desktop-inner w-full">
            <AdminSayfasi viewer={kullanici} />
          </div>
        ) : aktifSekme === "yonetim" ? (
          <div className="veli-desktop-inner w-full flex flex-col items-center justify-center gap-3 p-8 text-center" style={{ background: "#f1f5f9" }}>
            <div style={{ fontSize: 48 }}>🔒</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Erişim yetkiniz yok</div>
            <p style={{ fontSize: 14, color: "#64748b", maxWidth: 360, lineHeight: 1.55 }}>
              Yönetim raporları yalnızca yetkili yöneticiler tarafından görüntülenebilir.
            </p>
            <button
              type="button"
              onClick={() => setAktifSekme("form")}
              style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              Veli Bilgilendirme&apos;ye dön
            </button>
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
                  <PreviewPanel stageRef={desktopSahneRef}>
                    <div
                      className="veli-studio-poster-wrap"
                      style={{ width: desktopScaledW, height: desktopScaledH, flexShrink: 0 }}
                    >
                      <div
                        className="veli-preview-autofit__artboard"
                        style={{
                          width: POSTER_W,
                          height: POSTER_H,
                          transform: `scale(${desktopZoom})`,
                          transformOrigin: "top left",
                        }}
                      >
                        <VeliOnizlemeIcerik form={form} sablon={seciliSablon} />
                      </div>
                    </div>
                  </PreviewPanel>
                  {activeStep === VELI_WIZARD_LAST_STEP ? (
                    <>
                      <QualityPanel form={form} seciliSablon={seciliSablon} full />
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
          <div className="veli-wizard-mobile-content flex-1 overflow-y-auto" style={{ background: "#f8fafc", overflowX: "hidden" }}>
            <div className="p-4 space-y-4" style={{ overflowX: "hidden" }}>
              <QualityPanel form={form} seciliSablon={seciliSablon} full />
              <VeliOnizlemeMobil
                form={form}
                sablon={seciliSablon}
                zoom={zoom}
                wrapperRef={wrapperRef}
                onSablonOner={setSeciliSablon}
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
                <VeliOnizlemeMobil form={form} sablon={seciliSablon} zoom={zoom} wrapperRef={wrapperRef} onSablonOner={setSeciliSablon} />
              </div>
            </div>
          </div>
        )}

        {aktifSekme === "yonetim" && kullaniciRaporGorebilirMi(kullanici) && (
          <div className="flex-1 overflow-y-auto" style={{ background: "#f1f5f9" }}>
            <AdminSayfasi viewer={kullanici} />
          </div>
        )}

        {aktifSekme === "yonetim" && !kullaniciRaporGorebilirMi(kullanici) && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center" style={{ background: "#f1f5f9" }}>
            <div style={{ fontSize: 40 }}>🔒</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Erişim yetkiniz yok</div>
            <p style={{ fontSize: 13, color: "#64748b", maxWidth: 320, lineHeight: 1.5 }}>
              Yönetim raporları yalnızca yetkili yöneticiler tarafından görüntülenebilir.
            </p>
            <button
              type="button"
              onClick={() => setAktifSekme("form")}
              style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              Veli Bilgilendirme&apos;ye dön
            </button>
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
                <div className="veli-wizard-bottom-bar__exports">
                  <button type="button" onClick={afisiIndir} disabled={indiriliyor} className="veli-wizard-bottom-bar__btn veli-wizard-bottom-bar__btn--primary veli-wizard-bottom-bar__btn--compact">PNG</button>
                  <button type="button" onClick={pdfIndir} disabled={pdfYukleniyor} className="veli-wizard-bottom-bar__btn veli-wizard-bottom-bar__btn--danger veli-wizard-bottom-bar__btn--compact">PDF</button>
                  <button type="button" onClick={whatsappPaylas} className="veli-wizard-bottom-bar__btn veli-wizard-bottom-bar__btn--success veli-wizard-bottom-bar__btn--compact">WA</button>
                </div>
              )
            }
          />
        )}
      </div>

      {captureSnapshot && (
        <div style={{ position: "absolute", top: -9999, left: 0, width: POSTER_W, height: POSTER_H, overflow: "hidden", pointerEvents: "none" }}>
          <VeliOnizlemeIcerik
            form={captureSnapshot.form}
            sablon={captureSnapshot.sablon}
            artboardRef={downloadRef}
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
          adminGoster={kullaniciRaporGorebilirMi(kullanici)}
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
