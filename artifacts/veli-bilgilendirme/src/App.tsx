import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import { Toaster, toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { FormData, SablonTuru } from "./types";
import { aciklamaolustur } from "./lib/dil";
import { api, type KullaniciBilgisi } from "./lib/api";
import FormAlani from "./components/FormAlani";
import { VeliYanPanel } from "./components/veli/VeliYanPanel";
import { VeliOnizlemeIcerik } from "./components/veli/VeliOnizlemeIcerik";
import { VeliMobilNav } from "./components/veli/VeliMobilNav";
import { VeliOnizlemeMobil } from "./components/veli/VeliOnizlemeMobil";
import GirisEkrani from "./components/GirisEkrani";
import DestekModal from "./components/DestekModal";
import AdminSayfasi from "./components/AdminSayfasi";
import { CategoryHome } from "./components/ana-giris/CategoryHome";
import { DenemeSinaviModulu } from "./components/deneme/DenemeSinaviModulu";
import { KolayAfisModulu } from "./components/kolay-afis/KolayAfisModulu";

const KurumsalKimlikModulu = lazy(() =>
  import("./components/kurumsal-kimlik/KurumsalKimlikModulu").then((m) => ({
    default: m.KurumsalKimlikModulu,
  })),
);

const POSTER_W = 520;

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

  const downloadRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const adim2Ref = useRef<(() => void) | undefined>(undefined);
  const [zoom, setZoom] = useState(1);
  const [captureSnapshot, setCaptureSnapshot] = useState<{ form: FormData; sablon: SablonTuru } | null>(null);
  const captureResolveFn = useRef<(() => void) | null>(null);

  const logoGelistirmeAcik =
    import.meta.env.DEV ||
    (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("modul") === "logo");

  useEffect(() => {
    api.me().then((r) => setKullanici(r.user)).catch(() => setKullanici(null));
  }, []);

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

  const afisiIndir = async () => {
    setIndiriliyor(true);
    try {
      const dataUrl = await posterPngYakala();
      if (!dataUrl) return;

      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        window.open(dataUrl, "_blank");
      } else {
        const link = document.createElement("a");
        link.download = `tedris-vbs-${seciliSablon}.png`;
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
      pdf.save(`tedris-vbs-${seciliSablon}.pdf`);
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
              title: "Tedris Vbs - Veli Bilgilendirme Afişi",
              text: metin,
            });
            return;
          }
        }
      } catch {}
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(metin)}`, "_blank");
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

  const PaylasBtnlari = () => (
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

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: "#f1f5f9" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Toaster position="top-center" richColors />

      <header
        className="flex-shrink-0 flex items-center justify-between px-4"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2563eb 100%)",
          minHeight: 60,
          paddingTop: 10,
          paddingBottom: 10,
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
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <img
              src="/icon-192.png"
              alt=""
              style={{ width: 38, height: 38, objectFit: "cover" }}
              onError={(e) => {
                (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span style="font-size:20px">📚</span>';
              }}
            />
          </div>
          <div>
            <h1
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Tedris Vbs
            </h1>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", margin: "2px 0 0", letterSpacing: "0.02em" }}>
              {kullanici.name}
            </p>
          </div>
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

      <div className="hidden lg:flex flex-1 overflow-hidden">
        <aside className="w-80 flex-shrink-0 overflow-y-auto border-r border-slate-200" style={{ background: "#f8fafc" }}>
          <div className="p-5">
            <FormAlani
              form={form}
              setForm={setForm}
              seciliSablon={seciliSablon}
              setSeciliSablon={setSeciliSablon}
              onMetinYenile={yeniMetinUret}
              setMetinDuzenlendi={setMetinDuzenlendi}
              kullaniciId={kullanici.id}
              adim2Ref={adim2Ref}
            />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center" style={{ background: "#e8edf2" }}>
          {aktifSekme === "yonetim" && kullanici?.isAdmin ? (
            <div className="w-full">
              <AdminSayfasi />
            </div>
          ) : (
            <div className="w-full max-w-lg">
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#64748b" }}>
                5. Önizleme ve İndirme
              </h2>
              <p className="text-[11px] mb-4" style={{ color: "#94a3b8" }}>
                Afişi kontrol edin; PNG / PDF indirin veya WhatsApp ile paylaşın.
              </p>
              <div
                className="rounded-2xl overflow-hidden mb-4"
                style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
              >
                <VeliOnizlemeIcerik form={form} sablon={seciliSablon} />
              </div>
              <VeliYanPanel form={form} seciliSablon={seciliSablon} onSablonOner={setSeciliSablon} />
              <PaylasBtnlari />
              <p className="text-center text-xs mt-3" style={{ color: "#94a3b8" }}>
                Formu doldurun — afiş otomatik güncellenir
              </p>
            </div>
          )}
        </main>
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
  return <MainApp />;
}