import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { KullaniciBilgisi } from "@/lib/api";
import { olusturDuyuruMetni } from "@/lib/denemeMetinUret";
import { afisBoyutlari } from "@/lib/denemePosterBoyut";
import { initialPosterScene, type PosterSceneState } from "@/lib/denemePosterScene";
import { bosDenemeFormu, normalizeDenemeSinaviForm, type DenemeSinaviFormData } from "@/types/denemeSinavi";
import { DenemeSablonGalerisi } from "./DenemeSablonGalerisi";
import { DenemeSinaviForm } from "./DenemeSinaviForm";
import { DenemeSinaviPreview } from "./DenemeSinaviPreview";

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
    <div className="flex w-full max-w-xl gap-2">
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

export interface DenemeSinaviModuluProps {
  kullanici: KullaniciBilgisi;
  onAnaSayfa: () => void;
  onDestek: () => void;
  onYonetim: () => void;
  onCikis: () => void;
}

export function DenemeSinaviModulu({ kullanici, onAnaSayfa, onDestek, onYonetim, onCikis }: DenemeSinaviModuluProps) {
  const [form, setForm] = useState<DenemeSinaviFormData>(() => normalizeDenemeSinaviForm(bosDenemeFormu()));
  const [asama, setAsama] = useState<"galeri" | "editor">("galeri");
  const [duyuruElleDuzenlendi, setDuyuruElleDuzenlendi] = useState(false);
  const [mobilSekme, setMobilSekme] = useState<"form" | "onizleme">("form");
  const [indiriliyor, setIndiriliyor] = useState(false);
  const [pdfYukleniyor, setPdfYukleniyor] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [posterScene, setPosterScene] = useState<PosterSceneState>(() => initialPosterScene());
  const [captureSnapshot, setCaptureSnapshot] = useState<{ form: DenemeSinaviFormData; scene: PosterSceneState } | null>(null);
  const captureResolveFn = useRef<(() => void) | null>(null);

  const afisBoy = useMemo(() => {
    if (posterScene.elements.length > 0 || posterScene.editMode) return afisBoyutlari("a4");
    return afisBoyutlari(form.afisFormati);
  }, [form.afisFormati, posterScene.editMode, posterScene.elements.length]);

  useEffect(() => {
    if (!duyuruElleDuzenlendi) {
      setForm((prev) => ({ ...prev, duyuruMetni: olusturDuyuruMetni(prev, prev.metinTonu) }));
    }
  }, [
    duyuruElleDuzenlendi,
    form.kurumAdi,
    form.sinifModu,
    form.sinifTek,
    form.sinifOzelMetin,
    JSON.stringify(form.sinifCoklu),
    form.baslik,
    form.tarih,
    form.saat,
    form.katilimTuru,
    form.metinTonu,
    form.afisAmaci,
  ]);

  useEffect(() => {
    function hesapla() {
      if (!wrapperRef.current) return;
      setZoom(Math.min(1, wrapperRef.current.clientWidth / afisBoy.width));
    }
    hesapla();
    const obs = new ResizeObserver(hesapla);
    if (wrapperRef.current) obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, [mobilSekme, afisBoy.width]);

  useEffect(() => {
    if (captureSnapshot && captureResolveFn.current) {
      const resolve = captureResolveFn.current;
      captureResolveFn.current = null;
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }
  }, [captureSnapshot]);

  const posterPngYakala = useCallback(async (): Promise<string | null> => {
    await new Promise<void>((resolve) => {
      captureResolveFn.current = resolve;
      setCaptureSnapshot({
        form: { ...form },
        scene: { ...posterScene, editMode: false, selectedId: null },
      });
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
  }, [form, posterScene]);

  const pngIndir = async () => {
    setIndiriliyor(true);
    try {
      const dataUrl = await posterPngYakala();
      if (!dataUrl) return;

      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        window.open(dataUrl, "_blank");
      } else {
        const link = document.createElement("a");
        link.download = `nehari-deneme-sinavi-${form.sablon}.png`;
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
      pdf.save(`nehari-deneme-sinavi-${form.sablon}.pdf`);
    } finally {
      setPdfYukleniyor(false);
    }
  };

  const waPaylas = async () => {
    const metin = [
      form.kurumAdi && `📚 ${form.kurumAdi}`,
      form.baslik && `📝 ${form.baslik}`,
      form.tarih && `📅 ${form.tarih}${form.saat ? ` — ${form.saat}` : ""}`,
      form.telefon && `📞 ${form.telefon}`,
      form.duyuruMetni,
    ]
      .filter(Boolean)
      .join("\n\n");

    if (navigator.canShare) {
      try {
        const dataUrl = await posterPngYakala();
        if (dataUrl) {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], "deneme-sinavi.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: "Nehari Veli Bilgilendirme — Deneme sınavı afişi",
              text: metin,
            });
            return;
          }
        }
      } catch {
        /* Web Share API iptal veya hata */
      }
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(metin)}`, "_blank");
  };

  return (
    <div className="flex h-dvh flex-col bg-slate-100">
      <header
        className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2563eb 100%)",
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onAnaSayfa}
            className="flex shrink-0 items-center gap-1 rounded-xl border border-white/25 bg-white/10 px-2 py-2 text-[11px] font-bold text-white/95 transition hover:bg-white/20 sm:gap-1.5 sm:px-3 sm:text-xs"
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden min-[380px]:inline">Ana sayfaya dön</span>
            <span className="min-[380px]:hidden">Ana</span>
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-white">Deneme sınavı afişi</p>
            <p className="truncate text-[10px] text-white/60">{kullanici.name}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {asama === "editor" && (
            <button
              type="button"
              onClick={() => setAsama("galeri")}
              className="rounded-lg border border-white/25 bg-white/15 px-2 py-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-white/25 sm:px-2.5 sm:text-[11px]"
            >
              <span className="hidden min-[400px]:inline">Şablonlar</span>
              <span className="min-[400px]:hidden">Şablon</span>
            </button>
          )}
          <button
            type="button"
            onClick={onDestek}
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white sm:flex"
            title="Destek"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
          {kullanici.isAdmin ? (
            <button
              type="button"
              onClick={onYonetim}
              className="hidden rounded-lg border border-violet-300/40 bg-violet-500/20 px-2.5 py-2 text-[11px] font-semibold text-violet-100 lg:inline"
            >
              Yönetim
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCikis}
            className="rounded-lg border border-white/15 bg-white/10 px-2 py-2 text-[10px] font-semibold text-white/90 sm:px-3 sm:text-xs"
          >
            Çıkış
          </button>
        </div>
      </header>

      {asama === "galeri" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            <DenemeSablonGalerisi
              secili={form.sablon}
              onSec={(id) => {
                setForm((p) => normalizeDenemeSinaviForm({ ...p, sablon: id }));
                setPosterScene(initialPosterScene());
                setAsama("editor");
              }}
            />
          </div>
          <p className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 text-center text-[11px] font-medium text-slate-500">
            Bir şablona tıklayın — düzenleme ve canlı afiş ekranına geçilir.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden min-h-0 flex-1 lg:flex">
            <aside className="w-[min(100%,28rem)] shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50">
              <div className="p-4 pb-10">
                <DenemeSinaviForm
                  form={form}
                  setForm={setForm}
                  duyuruElleDuzenlendi={duyuruElleDuzenlendi}
                  setDuyuruElleDuzenlendi={setDuyuruElleDuzenlendi}
                  onSablonGaleri={() => setAsama("galeri")}
                />
              </div>
            </aside>
            <main className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto bg-[#e8edf2] p-4">
              <h2 className="mb-3 w-full max-w-xl text-xs font-semibold uppercase tracking-wider text-slate-500">Canlı önizleme</h2>
              <div className="mb-4 w-full max-w-xl overflow-x-auto overflow-y-visible rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
                <DenemeSinaviPreview data={form} posterScene={posterScene} onPosterSceneChange={setPosterScene} />
              </div>
              <PaylasSatir indiriliyor={indiriliyor} pdfYukleniyor={pdfYukleniyor} pngIndir={pngIndir} pdfIndir={pdfIndir} waPaylas={waPaylas} />
              <p className="mt-3 max-w-xl text-center text-xs text-slate-400">Formu doldurun — afiş anında güncellenir. Bu modül şimdilik yalnızca cihazınızda çalışır.</p>
            </main>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:hidden">
            {mobilSekme === "form" ? (
              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50">
                <div className="p-3 pb-6">
                  <DenemeSinaviForm
                    form={form}
                    setForm={setForm}
                    duyuruElleDuzenlendi={duyuruElleDuzenlendi}
                    setDuyuruElleDuzenlendi={setDuyuruElleDuzenlendi}
                    onSablonGaleri={() => setAsama("galeri")}
                  />
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto bg-[#e8edf2]">
                <div className="flex flex-col items-center gap-4 p-3 pb-6">
                  <div ref={wrapperRef} className="w-full">
                    <div style={{ zoom } as CSSProperties}>
                      <div style={{ width: afisBoy.width }} className="mx-auto">
                        <DenemeSinaviPreview data={form} posterScene={posterScene} onPosterSceneChange={setPosterScene} />
                      </div>
                    </div>
                  </div>
                  <PaylasSatir indiriliyor={indiriliyor} pdfYukleniyor={pdfYukleniyor} pngIndir={pngIndir} pdfIndir={pdfIndir} waPaylas={waPaylas} />
                  <p className="text-center text-[11px] text-slate-400">iPhone: PNG yeni sekmede açılır — basılı tutup kaydedebilirsiniz.</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {asama === "editor" ? (
      <nav
        className="flex shrink-0 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Modül sekmeleri"
      >
        <button
          type="button"
          onClick={() => setMobilSekme("form")}
          className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold ${mobilSekme === "form" ? "text-blue-700" : "text-slate-400"}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={mobilSekme === "form" ? 2.5 : 1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Form
        </button>
        <button
          type="button"
          onClick={() => setMobilSekme("onizleme")}
          className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold ${mobilSekme === "onizleme" ? "text-blue-700" : "text-slate-400"}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={mobilSekme === "onizleme" ? 2.5 : 1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Önizleme
        </button>
        <button type="button" onClick={onDestek} className="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold text-slate-400 sm:hidden">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Destek
        </button>
      </nav>
      ) : null}

      {captureSnapshot ? (
        <div
          className="pointer-events-none fixed left-0 top-[-9999px]"
          style={{
            width: afisBoyutlari(captureSnapshot.scene.elements.length > 0 ? "a4" : captureSnapshot.form.afisFormati).width,
          }}
        >
          <div
            ref={downloadRef}
            className="bg-white"
            style={{
              width: afisBoyutlari(captureSnapshot.scene.elements.length > 0 ? "a4" : captureSnapshot.form.afisFormati).width,
            }}
          >
            <DenemeSinaviPreview
              data={captureSnapshot.form}
              posterScene={{ ...captureSnapshot.scene, editMode: false, selectedId: null }}
              onPosterSceneChange={() => {}}
              variant="export"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

