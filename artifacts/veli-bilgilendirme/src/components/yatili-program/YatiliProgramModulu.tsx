import { useCallback, useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ArrowLeft, MessageCircle, Maximize2, Scan } from "lucide-react";
import type { KullaniciBilgisi } from "@/lib/api";
import { yatiliAfishBoyutlari } from "@/lib/yatili-program/yatiliPosterBoyut";
import { yatiliWhatsappMetniOlustur } from "@/lib/yatili-program/yatiliWhatsappMetin";
import { otomatikMetinDoldur, normalizeYatiliProgramForm } from "@/lib/yatili-program/yatiliMetinUretici";
import { yogunlukModuUygula } from "@/lib/yatili-program/yatiliBloklar";
import { bosYatiliFormu, type YatiliFormAdimi, type YatiliProgramFormData } from "@/types/yatiliProgram";
import { YatiliProgramFormu } from "./YatiliProgramFormu";
import { YatiliAfishOnizleme } from "./YatiliAfishOnizleme";
import { YatiliOnizlemeCerceve } from "./YatiliOnizlemeCerceve";

type OnizlemeOlcek = "sigdir" | "yuzde100";

function PaylasSatir({
  indiriliyor,
  pdfYukleniyor,
  pngIndir,
  pdfIndir,
  waPaylas,
}: {
  indiriliyor: boolean;
  pdfYukleniyor: boolean;
  pngIndir: () => void;
  pdfIndir: () => void;
  waPaylas: () => void;
}) {
  return (
    <div className="flex w-full gap-2">
      <button
        type="button"
        onClick={pngIndir}
        disabled={indiriliyor}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a9e] py-3 text-xs font-bold text-white shadow-md transition active:scale-[0.98] disabled:opacity-70"
      >
        {indiriliyor ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
        PNG
      </button>
      <button
        type="button"
        onClick={pdfIndir}
        disabled={pdfYukleniyor}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-red-500 py-3 text-xs font-bold text-white shadow-md transition active:scale-[0.98] disabled:opacity-70"
      >
        {pdfYukleniyor ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
        PDF
      </button>
      <button
        type="button"
        onClick={waPaylas}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-green-600 py-3 text-xs font-bold text-white shadow-md transition active:scale-[0.98]"
      >
        WA
      </button>
    </div>
  );
}

export interface YatiliProgramModuluProps {
  kullanici: KullaniciBilgisi;
  onAnaSayfa: () => void;
  onDestek: () => void;
  onCikis: () => void;
}

export function YatiliProgramModulu({ kullanici, onAnaSayfa, onDestek, onCikis }: YatiliProgramModuluProps) {
  const [form, setForm] = useState<YatiliProgramFormData>(() => {
    const b = bosYatiliFormu();
    const bloklar = yogunlukModuUygula(b.yogunlukModu);
    return normalizeYatiliProgramForm({ ...b, bloklar, ...otomatikMetinDoldur(b) });
  });
  const [adim, setAdim] = useState<YatiliFormAdimi>(1);
  const [mobilGorunum, setMobilGorunum] = useState<"form" | "onizleme">("form");
  const [onizlemeOlcek, setOnizlemeOlcek] = useState<OnizlemeOlcek>("sigdir");
  const [indiriliyor, setIndiriliyor] = useState(false);
  const [pdfYukleniyor, setPdfYukleniyor] = useState(false);

  const afisBoy = yatiliAfishBoyutlari();
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const posterOuterRef = useRef<HTMLDivElement>(null);
  const posterInnerRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [posterH, setPosterH] = useState(afisBoy.minHeight);
  const [captureSnapshot, setCaptureSnapshot] = useState<YatiliProgramFormData | null>(null);
  const captureResolveFn = useRef<(() => void) | null>(null);

  const normalizedForm = normalizeYatiliProgramForm(form);

  const olcekHesapla = useCallback(() => {
    if (onizlemeOlcek === "yuzde100") {
      setScale(1);
      return;
    }
    const area = previewAreaRef.current;
    const inner = posterInnerRef.current;
    if (!area || !inner) return;
    const pad = 16;
    const aw = area.clientWidth - pad * 2;
    const ah = area.clientHeight - pad * 2;
    const pw = afisBoy.width;
    const ph = inner.offsetHeight || afisBoy.minHeight;
    setPosterH(ph);
    setScale(Math.min(aw / pw, ah / ph, 1));
  }, [onizlemeOlcek, afisBoy.width, afisBoy.minHeight, normalizedForm]);

  useEffect(() => {
    olcekHesapla();
    const t1 = requestAnimationFrame(() => olcekHesapla());
    const t2 = window.setTimeout(olcekHesapla, 120);
    const obs = new ResizeObserver(olcekHesapla);
    if (previewAreaRef.current) obs.observe(previewAreaRef.current);
    if (posterInnerRef.current) obs.observe(posterInnerRef.current);
    return () => {
      cancelAnimationFrame(t1);
      window.clearTimeout(t2);
      obs.disconnect();
    };
  }, [olcekHesapla, mobilGorunum, normalizedForm, adim]);

  useEffect(() => {
    if (captureSnapshot && captureResolveFn.current) {
      const resolve = captureResolveFn.current;
      captureResolveFn.current = null;
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }
  }, [captureSnapshot]);

  const otomatikDoldur = useCallback(() => {
    const metin = otomatikMetinDoldur(form);
    setForm((p) => normalizeYatiliProgramForm({ ...p, ...metin }));
  }, [form]);

  const posterPngYakala = useCallback(async (): Promise<string | null> => {
    const snap = normalizeYatiliProgramForm(form);
    await new Promise<void>((resolve) => {
      captureResolveFn.current = resolve;
      setCaptureSnapshot(snap);
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
  }, [form]);

  const pngIndir = async () => {
    setIndiriliyor(true);
    try {
      const dataUrl = await posterPngYakala();
      if (!dataUrl) return;
      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        window.open(dataUrl, "_blank");
      } else {
        const link = document.createElement("a");
        link.download = `nehari-yatili-alistirma-${form.sablon}.png`;
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
      const imgH = (imgW * (downloadRef.current?.offsetHeight ?? afisBoy.minHeight)) / afisBoy.width;
      const finalH = Math.min(imgH, pdfH - margin * 2);
      const y = (pdfH - finalH) / 2;
      pdf.addImage(dataUrl, "PNG", margin, y, imgW, finalH);
      pdf.save(`nehari-yatili-alistirma-${form.sablon}.pdf`);
    } finally {
      setPdfYukleniyor(false);
    }
  };

  const waPaylas = async () => {
    const metin = yatiliWhatsappMetniOlustur(form);

    if (navigator.canShare) {
      try {
        const dataUrl = await posterPngYakala();
        if (dataUrl) {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], "yatili-alistirma.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: "Nehari Veli Bilgilendirme — Yatılı alıştırma afişi", text: metin });
            return;
          }
        }
      } catch {
        /* iptal */
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(metin)}`, "_blank");
  };

  const scaledW = afisBoy.width * scale;
  const scaledH = posterH * scale;

  return (
    <div className="flex h-dvh flex-col bg-slate-100">
      <header
        className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4"
        style={{ background: "linear-gradient(135deg, #0f2744 0%, #1e3a5f 55%, #2d5a9e 100%)" }}
      >
        <button type="button" onClick={onAnaSayfa} className="flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white">
          <ArrowLeft className="h-4 w-4" />
          Ana sayfa
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-extrabold text-white">Yatılı alıştırma afişi</p>
          <p className="truncate text-[10px] text-white/70">{kullanici.name}</p>
        </div>
        <button type="button" onClick={onDestek} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 text-white" title="Destek">
          <MessageCircle className="h-4 w-4" />
        </button>
      </header>

      <div className="flex shrink-0 border-b border-slate-200 bg-white lg:hidden">
        <button
          type="button"
          className={`flex-1 py-2.5 text-xs font-bold ${mobilGorunum === "form" ? "border-b-2 border-indigo-600 text-indigo-700" : "text-slate-500"}`}
          onClick={() => setMobilGorunum("form")}
        >
          Form
        </button>
        <button
          type="button"
          className={`flex-1 py-2.5 text-xs font-bold ${mobilGorunum === "onizleme" ? "border-b-2 border-indigo-600 text-indigo-700" : "text-slate-500"}`}
          onClick={() => setMobilGorunum("onizleme")}
        >
          Önizleme
        </button>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,52%)_minmax(0,48%)]">
        <aside
          className={[
            "relative z-10 flex min-h-0 flex-col overflow-hidden border-r border-slate-200 bg-white",
            mobilGorunum === "form" ? "flex" : "hidden lg:flex",
          ].join(" ")}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 lg:p-5">
            <YatiliProgramFormu
              form={form}
              onChange={setForm}
              adim={adim}
              setAdim={setAdim}
              onOtomatikDoldur={otomatikDoldur}
              onAdim5={() => setMobilGorunum("onizleme")}
            />
          </div>
        </aside>

        <section
          className={[
            "relative z-0 flex min-h-0 min-w-0 flex-col overflow-hidden",
            mobilGorunum === "onizleme" ? "flex" : "hidden lg:flex",
          ].join(" ")}
        >
          <YatiliOnizlemeCerceve
            form={normalizedForm}
            olcekToggle={
              <>
                <button
                  type="button"
                  onClick={() => setOnizlemeOlcek("sigdir")}
                  className={[
                    "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold",
                    onizlemeOlcek === "sigdir" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600",
                  ].join(" ")}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  Sığdır
                </button>
                <button
                  type="button"
                  onClick={() => setOnizlemeOlcek("yuzde100")}
                  className={[
                    "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold",
                    onizlemeOlcek === "yuzde100" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600",
                  ].join(" ")}
                >
                  <Scan className="h-3.5 w-3.5" />
                  %100
                </button>
              </>
            }
          >
            <div
              ref={previewAreaRef}
              className={[
                "pointer-events-auto flex min-h-0 flex-1 items-center justify-center p-8",
                onizlemeOlcek === "yuzde100" ? "items-start overflow-auto" : "items-center overflow-hidden",
              ].join(" ")}
            >
              <div
                ref={posterOuterRef}
                className="rounded-xl shadow-[0_28px_64px_-16px_rgba(15,23,42,0.4),0_8px_24px_-8px_rgba(15,23,42,0.15)]"
                style={{ width: scaledW, height: scaledH, flexShrink: 0 }}
              >
                <div
                  ref={posterInnerRef}
                  style={{
                    width: afisBoy.width,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <YatiliAfishOnizleme data={normalizedForm} />
                </div>
              </div>
            </div>
            <div className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-3">
              <PaylasSatir indiriliyor={indiriliyor} pdfYukleniyor={pdfYukleniyor} pngIndir={pngIndir} pdfIndir={pdfIndir} waPaylas={waPaylas} />
            </div>
          </YatiliOnizlemeCerceve>
        </section>
      </div>

      {captureSnapshot ? (
        <div style={{ position: "fixed", top: -9999, left: 0, zIndex: -1, pointerEvents: "none" }}>
          <div ref={downloadRef}>
            <YatiliAfishOnizleme data={normalizeYatiliProgramForm(captureSnapshot)} />
          </div>
        </div>
      ) : null}

      <footer className="flex shrink-0 justify-end border-t border-slate-200 bg-white px-3 py-2 lg:hidden">
        <button type="button" onClick={onCikis} className="text-xs font-semibold text-slate-500">
          Çıkış
        </button>
      </footer>
    </div>
  );
}

