import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ArrowLeft, ChevronLeft, ChevronRight, MessageCircle, Maximize2, Scan } from "lucide-react";
import type { KullaniciBilgisi } from "@/lib/api";
import { ucAlternatifUret, briefOlustur } from "@/lib/kolay-afis/afisBriefOlusturucu";
import { afisPosterBoyutlari } from "@/lib/kolay-afis/afisPosterBoyut";
import { afisWhatsappMetni } from "@/lib/kolay-afis/afisWhatsappMetin";
import {
  bosKolayAfisForm,
  type AfisAlternatif,
  type AfisBrief,
  type AfisTemaId,
  type BilgiYogunlugu,
  type KolayAfisAdimi,
  type KolayAfisForm,
} from "@/types/kolayAfis";
import { AILE_ADLARI, YOGUNLUK_SECENEKLERI } from "@/types/kolayAfis";
import { AfisTuruAdimi } from "./AfisTuruAdimi";
import { HedefStilAdimi } from "./HedefStilAdimi";
import { BilgilerAdimi } from "./BilgilerAdimi";
import { OtomatikUretimAdimi } from "./OtomatikUretimAdimi";
import { AfisSonucKartlari } from "./AfisSonucKartlari";
import { AfisDuzenlemePaneli } from "./AfisDuzenlemePaneli";
import { AfisPosterRender } from "./AfisPosterRender";

const ADIM_AD: Record<KolayAfisAdimi, string> = {
  1: "Afiş türü",
  2: "Hedef ve stil",
  3: "Bilgiler",
  4: "Otomatik üretim",
  5: "Seç / düzenle / indir",
};

type OnizlemeOlcek = "sigdir" | "yuzde100";

function PaylasSatir({ indiriliyor, pdfYukleniyor, pngIndir, pdfIndir, waPaylas }: {
  indiriliyor: boolean;
  pdfYukleniyor: boolean;
  pngIndir: () => void;
  pdfIndir: () => void;
  waPaylas: () => void;
}) {
  return (
    <div className="flex w-full gap-2">
      <button type="button" onClick={pngIndir} disabled={indiriliyor} className="flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a9e] py-3 text-xs font-bold text-white disabled:opacity-70">
        {indiriliyor ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : "PNG"}
      </button>
      <button type="button" onClick={pdfIndir} disabled={pdfYukleniyor} className="flex flex-1 items-center justify-center rounded-2xl bg-red-500 py-3 text-xs font-bold text-white disabled:opacity-70">
        {pdfYukleniyor ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : "PDF"}
      </button>
      <button type="button" onClick={waPaylas} className="flex flex-1 items-center justify-center rounded-2xl bg-green-600 py-3 text-xs font-bold text-white">
        WA
      </button>
    </div>
  );
}

function briefUygulaToggles(brief: AfisBrief, qrGoster: boolean, ikonlu: boolean): AfisBrief {
  return {
    ...brief,
    ozellikIkonlu: ikonlu && brief.ozellikIkonlu,
    bloklar: { ...brief.bloklar, qr: qrGoster && brief.bloklar.qr },
  };
}

export function KolayAfisModulu({
  kullanici,
  onAnaSayfa,
  onDestek,
  onCikis,
}: {
  kullanici: KullaniciBilgisi;
  onAnaSayfa: () => void;
  onDestek: () => void;
  onCikis: () => void;
}) {
  const [form, setForm] = useState<KolayAfisForm>(bosKolayAfisForm);
  const [adim, setAdim] = useState<KolayAfisAdimi>(1);
  const [alternatifler, setAlternatifler] = useState<AfisAlternatif[]>([]);
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [uretildi, setUretildi] = useState(false);
  const [duzenlemeAcik, setDuzenlemeAcik] = useState(false);
  const [qrGoster, setQrGoster] = useState(true);
  const [ikonluMaddeler, setIkonluMaddeler] = useState(true);
  const [mobilGorunum, setMobilGorunum] = useState<"form" | "onizleme">("form");
  const [onizlemeOlcek, setOnizlemeOlcek] = useState<OnizlemeOlcek>("sigdir");
  const [indiriliyor, setIndiriliyor] = useState(false);
  const [pdfYukleniyor, setPdfYukleniyor] = useState(false);

  const afisBoy = afisPosterBoyutlari();
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const posterInnerRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [posterH, setPosterH] = useState(afisBoy.minHeight);
  const [captureBrief, setCaptureBrief] = useState<AfisBrief | null>(null);
  const captureResolveFn = useRef<(() => void) | null>(null);

  const seciliAlt = alternatifler.find((a) => a.id === seciliId) ?? alternatifler[1] ?? null;

  const aktifBrief = useMemo(() => {
    if (!seciliAlt) return null;
    const taze = briefOlustur(form, seciliAlt.varyant);
    const birlesik: AfisBrief = { ...taze, tema: seciliAlt.brief.tema };
    return briefUygulaToggles(birlesik, qrGoster, ikonluMaddeler);
  }, [form, seciliAlt, qrGoster, ikonluMaddeler]);

  const alternatifleriYenile = useCallback((f: KolayAfisForm, koruSecim = true) => {
    const alts = ucAlternatifUret(f);
    setAlternatifler(alts);
    setUretildi(true);
    if (!koruSecim || !seciliId) setSeciliId("dengeli");
    else if (!alts.some((a) => a.id === seciliId)) setSeciliId("dengeli");
  }, [seciliId]);

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
    const ph = inner.offsetHeight || afisBoy.minHeight;
    setPosterH(ph);
    setScale(Math.min(aw / afisBoy.width, ah / ph, 1));
  }, [onizlemeOlcek, afisBoy.width, afisBoy.minHeight, aktifBrief]);

  useEffect(() => {
    olcekHesapla();
    const obs = new ResizeObserver(olcekHesapla);
    if (previewAreaRef.current) obs.observe(previewAreaRef.current);
    if (posterInnerRef.current) obs.observe(posterInnerRef.current);
    return () => obs.disconnect();
  }, [olcekHesapla, mobilGorunum, aktifBrief]);

  useEffect(() => {
    if (captureBrief && captureResolveFn.current) {
      const resolve = captureResolveFn.current;
      captureResolveFn.current = null;
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }
  }, [captureBrief]);

  const afisleriOlustur = () => {
    alternatifleriYenile(form, false);
    setAdim(5);
    setMobilGorunum("onizleme");
  };

  const temaDegistir = (tema: AfisTemaId) => {
    setAlternatifler((prev) =>
      prev.map((a) => (a.id === seciliId ? { ...a, brief: { ...a.brief, tema } } : a)),
    );
  };

  const yogunlukDegistir = (y: BilgiYogunlugu) => {
    setForm((f) => {
      const next = { ...f, yogunluk: y };
      if (uretildi) alternatifleriYenile(next, true);
      return next;
    });
  };

  const posterPngYakala = async (): Promise<string | null> => {
    if (!aktifBrief) return null;
    await new Promise<void>((resolve) => {
      captureResolveFn.current = resolve;
      setCaptureBrief(aktifBrief);
    });
    if (!downloadRef.current) {
      setCaptureBrief(null);
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
      setCaptureBrief(null);
      return canvas.toDataURL("image/png");
    } catch {
      setCaptureBrief(null);
      return null;
    }
  };

  const pngIndir = async () => {
    setIndiriliyor(true);
    try {
      const dataUrl = await posterPngYakala();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = `nehari-afis-${seciliAlt?.varyant ?? "afis"}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      pdf.addImage(dataUrl, "PNG", margin, (pdfH - finalH) / 2, imgW, finalH);
      pdf.save(`nehari-afis-${seciliAlt?.varyant ?? "afis"}.pdf`);
    } finally {
      setPdfYukleniyor(false);
    }
  };

  const waPaylas = async () => {
    if (!aktifBrief) return;
    const metin = afisWhatsappMetni(form, aktifBrief);
    window.open(`https://wa.me/?text=${encodeURIComponent(metin)}`, "_blank");
  };

  const scaledW = afisBoy.width * scale;
  const scaledH = posterH * scale;

  const ileri = () => {
    if (adim < 5) setAdim((adim + 1) as KolayAfisAdimi);
    if (adim === 4) afisleriOlustur();
  };

  const yogunlukAd = YOGUNLUK_SECENEKLERI.find((y) => y.id === form.yogunluk)?.ad ?? "";

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
          <p className="truncate text-sm font-extrabold text-white">Kolay Afiş Üretici</p>
          <p className="truncate text-[10px] text-white/70">{kullanici.name}</p>
        </div>
        <button type="button" onClick={onDestek} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 text-white">
          <MessageCircle className="h-4 w-4" />
        </button>
      </header>

      <div className="flex shrink-0 border-b border-slate-200 bg-white lg:hidden">
        <button type="button" className={`flex-1 py-2.5 text-xs font-bold ${mobilGorunum === "form" ? "border-b-2 border-indigo-600 text-indigo-700" : "text-slate-500"}`} onClick={() => setMobilGorunum("form")}>
          Sihirbaz
        </button>
        <button type="button" className={`flex-1 py-2.5 text-xs font-bold ${mobilGorunum === "onizleme" ? "border-b-2 border-indigo-600 text-indigo-700" : "text-slate-500"}`} onClick={() => setMobilGorunum("onizleme")}>
          Önizleme
        </button>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,52%)_minmax(0,48%)]">
        <aside className={`relative z-10 flex min-h-0 flex-col overflow-hidden border-r border-slate-200 bg-white ${mobilGorunum === "form" ? "flex" : "hidden lg:flex"}`}>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 lg:p-5">
            <div className="mb-4">
              <div className="flex gap-1">
                {([1, 2, 3, 4, 5] as KolayAfisAdimi[]).map((n) => (
                  <button key={n} type="button" onClick={() => setAdim(n)} className={`h-2 flex-1 rounded-full ${n <= adim ? "bg-indigo-500" : "bg-slate-200"}`} aria-label={ADIM_AD[n]} />
                ))}
              </div>
              <p className="mt-2 text-sm font-extrabold text-slate-800">
                Adım {adim}/5 · {ADIM_AD[adim]}
              </p>
            </div>

            {adim === 1 && <AfisTuruAdimi form={form} onChange={setForm} />}
            {adim === 2 && <HedefStilAdimi form={form} onChange={setForm} />}
            {adim === 3 && <BilgilerAdimi form={form} onChange={setForm} />}
            {adim === 4 && <OtomatikUretimAdimi form={form} onUret={afisleriOlustur} uretildi={uretildi} />}
            {adim === 5 && uretildi ? (
              <div className="space-y-4">
                <AfisSonucKartlari form={form} alternatifler={alternatifler} seciliId={seciliId} onSec={setSeciliId} ikonluMaddeler={ikonluMaddeler} />
                <AfisDuzenlemePaneli
                  acik={duzenlemeAcik}
                  onAcikDegistir={setDuzenlemeAcik}
                  form={form}
                  onChange={setForm}
                  alternatif={seciliAlt}
                  qrGoster={qrGoster}
                  ikonluMaddeler={ikonluMaddeler}
                  onQrToggle={setQrGoster}
                  onIkonToggle={setIkonluMaddeler}
                  onTemaDegistir={temaDegistir}
                  onYogunlukDegistir={yogunlukDegistir}
                />
              </div>
            ) : adim === 5 ? (
              <p className="text-sm text-slate-500">Önce adım 4&apos;te afişleri oluşturun.</p>
            ) : null}
          </div>

          <div className="sticky bottom-0 z-20 flex shrink-0 gap-2 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-sm">
            {adim > 1 ? (
              <button type="button" onClick={() => setAdim((adim - 1) as KolayAfisAdimi)} className="flex flex-1 items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-bold text-slate-600">
                <ChevronLeft className="h-4 w-4" />
                Geri
              </button>
            ) : (
              <div className="flex-1" />
            )}
            {adim < 5 ? (
              <button type="button" onClick={ileri} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white">
                {adim === 4 ? "Afişleri oluştur" : "İleri"}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </aside>

        <section className={`relative z-0 flex min-h-0 min-w-0 flex-col overflow-hidden ${mobilGorunum === "onizleme" ? "flex" : "hidden lg:flex"}`}>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white/95 px-4 py-2.5">
            <div className="flex flex-wrap gap-x-3 text-[11px] font-semibold text-slate-600">
              {seciliAlt ? (
                <>
                  <span>
                    <span className="text-slate-400">Aile:</span> {AILE_ADLARI[seciliAlt.aile]}
                  </span>
                  <span>
                    <span className="text-slate-400">Paket:</span> {seciliAlt.baslik}
                  </span>
                  <span>
                    <span className="text-slate-400">Yoğunluk:</span> {yogunlukAd}
                  </span>
                </>
              ) : (
                <span className="text-slate-400">Önizleme için afiş oluşturun</span>
              )}
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={() => setOnizlemeOlcek("sigdir")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${onizlemeOlcek === "sigdir" ? "bg-indigo-600 text-white" : "bg-slate-100"}`}>
                <Maximize2 className="mr-1 inline h-3.5 w-3.5" />
                Sığdır
              </button>
              <button type="button" onClick={() => setOnizlemeOlcek("yuzde100")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${onizlemeOlcek === "yuzde100" ? "bg-indigo-600 text-white" : "bg-slate-100"}`}>
                <Scan className="mr-1 inline h-3.5 w-3.5" />
                %100
              </button>
            </div>
          </div>

          <div ref={previewAreaRef} className={`flex min-h-0 flex-1 items-center justify-center bg-[linear-gradient(160deg,#e2e8f0,#f8fafc)] p-8 ${onizlemeOlcek === "yuzde100" ? "overflow-auto items-start" : "overflow-hidden"}`}>
            {aktifBrief ? (
              <div className="rounded-xl shadow-[0_28px_64px_-16px_rgba(15,23,42,0.4)]" style={{ width: scaledW, height: scaledH }}>
                <div ref={posterInnerRef} style={{ width: afisBoy.width, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <AfisPosterRender form={form} brief={aktifBrief} ikonluMaddeler={ikonluMaddeler} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Afişleri oluşturduğunuzda önizleme burada görünür.</p>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
            <PaylasSatir indiriliyor={indiriliyor} pdfYukleniyor={pdfYukleniyor} pngIndir={pngIndir} pdfIndir={pdfIndir} waPaylas={waPaylas} />
          </div>
        </section>
      </div>

      {captureBrief ? (
        <div style={{ position: "fixed", top: -9999, left: 0, zIndex: -1, pointerEvents: "none" }}>
          <div ref={downloadRef}>
            <AfisPosterRender form={form} brief={captureBrief} ikonluMaddeler={ikonluMaddeler} />
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

