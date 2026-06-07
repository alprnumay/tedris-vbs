import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import { Toaster, toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { FormData, SablonTuru } from "./types";
import { aciklamaolustur } from "./lib/dil";
import { api, type KullaniciBilgisi } from "./lib/api";
import { backendApi, type PosterDraftData } from "./lib/backendApi";
import FormAlani from "./components/FormAlani";
import { VeliOnizlemeIcerik } from "./components/veli/VeliOnizlemeIcerik";
import { VeliYanPanel } from "./components/veli/VeliYanPanel";
import { VeliMobilNav } from "./components/veli/VeliMobilNav";
import { VeliOnizlemeMobil } from "./components/veli/VeliOnizlemeMobil";
import { SABLON_LISTESI } from "./lib/sablonlar";
import { veliKaliteKontrol } from "./lib/veli/veliKaliteKontrol";
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

const POSTER_W = 520;
const POSTER_H_FALLBACK = 720;

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
  const [metinDuzenlendi, setMetinDuzenlendi] = useState(false);
  const [destekAcik, setDestekAcik] = useState(false);
  const [formAdim, setFormAdim] = useState<1 | 2>(1);
  const [taslakIslem, setTaslakIslem] = useState<"kaydet" | "yukle" | "sil" | null>(null);
  const [sonTaslakId, setSonTaslakId] = useState<string | number | null>(null);

  const downloadRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const desktopSahneRef = useRef<HTMLDivElement>(null);
  const posterInnerRef = useRef<HTMLDivElement>(null);
  const adim2Ref = useRef<(() => void) | undefined>(undefined);
  const [zoom, setZoom] = useState(1);
  const [desktopZoom, setDesktopZoom] = useState(0.72);
  const [posterH, setPosterH] = useState(POSTER_H_FALLBACK);
  const [captureSnapshot, setCaptureSnapshot] = useState<{ form: FormData; sablon: SablonTuru } | null>(null);
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
    if (logoGelistirmeAcik && kullanici && new URLSearchParams(window.location.search).get("modul") === "logo") {
      setHomeModu("logo");
    }
  }, [kullanici, logoGelistirmeAcik]);

  useEffect(() => {
    function hesapla() {
      if (!wrapperRef.current) return;
      setZoom(Math.min(1, wrapperRef.current.clientWidth / POSTER_W));
    }
    hesapla();
    const obs = new ResizeObserver(hesapla);
    if (wrapperRef.current) obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, [aktifSekme]);

  const desktopOlcekHesapla = useCallback(() => {
    const area = desktopSahneRef.current;
    const inner = posterInnerRef.current;
    if (!area || !inner) return;
    const pad = 12;
    const aw = area.clientWidth - pad * 2;
    const ah = area.clientHeight - pad * 2;
    const ph = inner.offsetHeight || POSTER_H_FALLBACK;
    setPosterH(ph);
    const s = Math.min(aw / POSTER_W, ah / ph, 1);
    setDesktopZoom(s);
  }, []);

  useEffect(() => {
    desktopOlcekHesapla();
    const t1 = requestAnimationFrame(() => desktopOlcekHesapla());
    const t2 = window.setTimeout(desktopOlcekHesapla, 120);
    const obs = new ResizeObserver(desktopOlcekHesapla);
    if (desktopSahneRef.current) obs.observe(desktopSahneRef.current);
    if (posterInnerRef.current) obs.observe(posterInnerRef.current);
    return () => {
      cancelAnimationFrame(t1);
      window.clearTimeout(t2);
      obs.disconnect();
    };
  }, [desktopOlcekHesapla, form, seciliSablon]);

  const desktopSigdir = useCallback(() => {
    desktopOlcekHesapla();
  }, [desktopOlcekHesapla]);

  const desktopScaledW = Math.round(POSTER_W * desktopZoom);
  const desktopScaledH = Math.round(posterH * desktopZoom);

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

    if (!downloadRef.current) {
      setCaptureSnapshot(null);
      return null;
    }

    try {
      const canvas = await html2canvas(downloadRef.current, {
        scale: 2.5,
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
      const imgH = (imgW * (downloadRef.current?.offsetHeight ?? 750)) / POSTER_W;
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
    return (
      <>
        <Toaster position="top-center" richColors />
        <CategoryHome
          kullaniciAdi={kullanici.name}
          isAdmin={Boolean(kullanici.isAdmin)}
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

  const PaylasBtnlari = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
      <div style={{ display: "flex", gap: 6 }}>
        <button type="button" onClick={taslakKaydet} disabled={Boolean(taslakIslem)} style={draftBtnStil(taslakIslem === "kaydet")}>
          {taslakIslem === "kaydet" ? "Kaydediliyor..." : "Taslağı Kaydet"}
        </button>
        <button type="button" onClick={sonTaslagiYukle} disabled={Boolean(taslakIslem)} style={draftBtnStil(taslakIslem === "yukle")}>
          {taslakIslem === "yukle" ? "Yükleniyor..." : "Son Taslağı Yükle"}
        </button>
        <button type="button" onClick={taslakSil} disabled={Boolean(taslakIslem)} style={draftBtnStil(taslakIslem === "sil")}>
          {taslakIslem === "sil" ? "Siliniyor..." : "Taslağı Sil"}
        </button>
      </div>
    </div>
  );

  const desktopKalite = veliKaliteKontrol(form, seciliSablon);
  const desktopSablonAd = SABLON_LISTESI.find((s) => s.id === seciliSablon)?.ad ?? seciliSablon;
  const desktopKaliteEtiket =
    desktopKalite.durum === "hazir" ? "Hazır" : desktopKalite.durum === "dikkat" ? "Dikkat" : "Eksik";

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: "#f1f5f9" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Toaster position="top-center" richColors />

      <header
        className="tedris-app-header flex-shrink-0 flex items-center justify-between px-4"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2563eb 100%)",
          minHeight: aktifSekme === "yonetim" ? 60 : 54,
          paddingTop: aktifSekme === "yonetim" ? 10 : 7,
          paddingBottom: aktifSekme === "yonetim" ? 10 : 7,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              setHomeModu("kategoriler");
              setAktifSekme("form");
            }}
            className="flex shrink-0 items-center gap-1 rounded-xl border border-white/25 bg-white/10 px-2.5 py-2 text-[11px] font-bold text-white/95 transition hover:bg-white/20 sm:gap-1.5 sm:px-3 sm:text-xs"
            title="Kategori seçim ekranına dön"
          >
            <svg className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden min-[380px]:inline">Ana sayfaya dön</span>
            <span className="min-[380px]:hidden">Ana</span>
          </button>
          <AppBrand kullaniciAdi={kullanici.name} />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setDestekAcik(true)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.12)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
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

          {kullanici?.isAdmin && (
            <button
              onClick={() => setAktifSekme("yonetim")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
              style={{
                background:
                  aktifSekme === "yonetim" ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.15)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer",
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z"
                />
              </svg>
              Yönetim
            </button>
          )}

          <button
            onClick={cikisYap}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{
              background: "rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(255,255,255,0.18)",
              cursor: "pointer",
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:inline">Çıkış</span>
          </button>
        </div>
      </header>

      <div className={`veli-desktop-workspace ${aktifSekme === "yonetim" ? "" : "veli-desktop-workspace--veli"} hidden lg:flex flex-1 min-h-0`}>
        {aktifSekme === "yonetim" && kullanici?.isAdmin ? (
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
                  <span className="veli-desktop-pill">
                    <span className="veli-desktop-pill__label">Adım</span>
                    {formAdim === 1 ? "Bilgiler" : "Tasarım"}
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
                      onAdimChange={setFormAdim}
                      onGorselYuklendi={(adet) => backendEvent("image_uploaded", { count: adet })}
                    />
                  </div>
                </div>

                <div className="veli-desktop-preview-col">
                  <div className="veli-studio-stage">
                    <div className="veli-stage-toolbar">
                      <div className="veli-stage-toolbar__left">
                        <span className="veli-stage-toolbar__label">Önizleme</span>
                        <span className="veli-stage-toolbar__sub">Canlı afiş görünümü</span>
                      </div>
                      <div className="veli-stage-toolbar__right">
                        <button type="button" className="veli-stage-btn" onClick={desktopSigdir}>
                          Sığdır
                        </button>
                        <span className="veli-stage-zoom">{Math.round(desktopZoom * 100)}%</span>
                      </div>
                    </div>
                    <div ref={desktopSahneRef} className="veli-studio-sahne">
                      <div
                        className="veli-studio-poster-wrap"
                        style={{ width: desktopScaledW, height: desktopScaledH, flexShrink: 0 }}
                      >
                        <div
                          ref={posterInnerRef}
                          style={{
                            width: POSTER_W,
                            transform: `scale(${desktopZoom})`,
                            transformOrigin: "top center",
                          }}
                        >
                          <VeliOnizlemeIcerik form={form} sablon={seciliSablon} />
                        </div>
                      </div>
                    </div>
                    <p className="veli-studio-hint">Formu doldurdukça afiş canlı güncellenir.</p>
                  </div>
                  <div className="veli-studio-actions">
                    <PaylasBtnlari />
                  </div>
                  <div className="veli-desktop-aside-below">
                    <VeliYanPanel
                      form={form}
                      seciliSablon={seciliSablon}
                      onSablonOner={setSeciliSablon}
                      studio
                    />
                  </div>
                </div>

                <aside className="veli-desktop-aside-col" aria-label="Yardımcı panel">
                  <div className="veli-desktop-aside-sticky">
                    <VeliYanPanel
                      form={form}
                      seciliSablon={seciliSablon}
                      onSablonOner={setSeciliSablon}
                      studio
                    />
                  </div>
                </aside>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="lg:hidden flex-1 overflow-hidden flex flex-col">
        {aktifSekme === "form" && (
          <div className="flex-1 overflow-y-auto" style={{ background: "#f8fafc" }}>
            <div className="p-4 pb-28">
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
                onGorselYuklendi={(adet) => backendEvent("image_uploaded", { count: adet })}
                onTasarimaGec={() => {
                  adim2Ref.current?.();
                  setAktifSekme("onizleme");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          </div>
        )}

        {aktifSekme === "onizleme" && (
          <div className="flex-1 overflow-y-auto">
            <VeliOnizlemeMobil
              form={form}
              sablon={seciliSablon}
              zoom={zoom}
              wrapperRef={wrapperRef}
              onSablonOner={setSeciliSablon}
              paylasBtnlari={<PaylasBtnlari />}
            />
          </div>
        )}

        {aktifSekme === "yonetim" && kullanici?.isAdmin && (
          <div className="flex-1 overflow-y-auto" style={{ background: "#f1f5f9" }}>
            <AdminSayfasi />
          </div>
        )}
      </div>

      {captureSnapshot && (
        <div style={{ position: "absolute", top: -9999, left: 0, width: POSTER_W, pointerEvents: "none" }}>
          <div ref={downloadRef} style={{ width: POSTER_W, background: "#ffffff" }}>
            <VeliOnizlemeIcerik form={captureSnapshot.form} sablon={captureSnapshot.sablon} />
          </div>
        </div>
      )}

      <VeliMobilNav
        aktifSekme={aktifSekme}
        onSekme={(sekme) => {
          if (sekme === "form" && aktifSekme === "onizleme") adim2Ref.current?.();
          setAktifSekme(sekme);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        adminGoster={Boolean(kullanici?.isAdmin)}
        onDestek={() => setDestekAcik(true)}
      />

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
