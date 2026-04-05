import { useState, useRef, useEffect, useCallback } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { FormData, SablonTuru } from "./types";
import { aciklamaolustur } from "./lib/dil";
import { api, type KullaniciBilgisi, type KayitliAfis } from "./lib/api";
import { SABLON_GORSEL_LIMITLERI, SABLON_LISTESI } from "./lib/sablonlar";
import FormAlani from "./components/FormAlani";
import GirisEkrani from "./components/GirisEkrani";
import DestekModal from "./components/DestekModal";
import AdminSayfasi from "./components/AdminSayfasi";
import SablonAkademik from "./components/sablonlar/SablonAkademik";
import SablonEtkinlik from "./components/sablonlar/SablonEtkinlik";
import SablonBulten from "./components/sablonlar/SablonBulten";
import SablonTemali from "./components/sablonlar/SablonTemali";
import SablonPremiumMinimal from "./components/sablonlar/SablonPremiumMinimal";
import SablonKartliBilgi from "./components/sablonlar/SablonKartliBilgi";
import SablonKurumsalResmi from "./components/sablonlar/SablonKurumsalResmi";
import SablonHikaye from "./components/sablonlar/SablonHikaye";
import SablonFotografOdakli from "./components/sablonlar/SablonFotografOdakli";

const POSTER_W = 520;
const TEMALI_SABLONLAR: SablonTuru[] = ["lacivert", "mor", "kirmizi", "turuncu", "pembe", "teal", "altin"];

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

function bugunTarih(): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  try {
    return new Date().toLocaleDateString("tr-TR", opts);
  } catch {
    try {
      return new Date().toLocaleDateString(undefined, opts);
    } catch {
      return new Date().toDateString();
    }
  }
}

function OnizlemeIcerik({ form, sablon }: { form: FormData; sablon: SablonTuru }) {
  const tarih = bugunTarih();
  const limit = SABLON_GORSEL_LIMITLERI[sablon] ?? 4;
  const f = { ...form, gorseller: form.gorseller.slice(0, limit) };

  if (sablon === "akademik") return <SablonAkademik form={f} tarih={tarih} />;
  if (sablon === "etkinlik") return <SablonEtkinlik form={f} tarih={tarih} />;
  if (sablon === "bulten") return <SablonBulten form={f} tarih={tarih} />;
  if (sablon === "premium-minimal") return <SablonPremiumMinimal form={f} tarih={tarih} />;
  if (sablon === "kartli-bilgi") return <SablonKartliBilgi form={f} tarih={tarih} />;
  if (sablon === "kurumsal-resmi") return <SablonKurumsalResmi form={f} tarih={tarih} />;
  if (sablon === "hikaye") return <SablonHikaye form={f} tarih={tarih} />;
  if (sablon === "fotograf-odakli") return <SablonFotografOdakli form={f} tarih={tarih} />;
  if (TEMALI_SABLONLAR.includes(sablon)) return <SablonTemali form={f} tarih={tarih} sablonId={sablon} />;

  return <SablonAkademik form={f} tarih={tarih} />;
}

function AfislerPaneli({
  afisler,
  yukleniyor,
  onKapat,
  onYukle,
  onSil,
}: {
  afisler: KayitliAfis[];
  yukleniyor: boolean;
  onKapat: () => void;
  onYukle: (a: KayitliAfis) => void;
  onSil: (id: number) => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex" }}>
      <div onClick={onKapat} style={{ flex: 1, background: "rgba(0,0,0,0.45)" }} />
      <div
        style={{
          width: 360,
          background: "#fff",
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: "1px solid #e2e8f0",
            background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a9e 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>Kayıtlı Afişlerim</h2>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: "3px 0 0" }}>
              {afisler.length > 0 ? `${afisler.length} afiş kayıtlı` : "Afiş yükleme alanı"}
            </p>
          </div>
          <button
            onClick={onKapat}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
              fontSize: 20,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          {yukleniyor && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  border: "3px solid #e2e8f0",
                  borderTopColor: "#1e3a5f",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 12px",
                }}
              />
              <p style={{ color: "#94a3b8", fontSize: 13 }}>Yükleniyor...</p>
            </div>
          )}

          {!yukleniyor && afisler.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 16px" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <svg width={28} height={28} fill="none" stroke="#94a3b8" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
              </div>
              <p style={{ fontSize: 14, color: "#334155", fontWeight: 700 }}>Henüz kayıtlı afiş yok</p>
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, lineHeight: 1.5 }}>
                Formu doldurup "Bu Afişi Kaydet" butonunu kullanın
              </p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {afisler.map((a) => {
              const tarihStr = new Date(a.createdAt).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const sablonMeta = SABLON_LISTESI.find((s) => s.id === a.sablon);

              let kurumAdi = "";
              try {
                const fd = JSON.parse(a.formData);
                kurumAdi = fd.kurumAdi || "";
              } catch {}

              return (
                <div
                  key={a.id}
                  style={{
                    borderRadius: 14,
                    border: "1.5px solid #e2e8f0",
                    overflow: "hidden",
                    background: "#fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ height: 5, background: sablonMeta?.chipRenk || "#1e3a5f" }} />
                  <div style={{ padding: "12px 14px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontWeight: 800,
                            fontSize: 13,
                            color: "#0f172a",
                            margin: 0,
                            lineHeight: 1.3,
                          }}
                        >
                          {a.title}
                        </p>
                        {kurumAdi && kurumAdi !== a.title && (
                          <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>{kurumAdi}</p>
                        )}
                      </div>
                      <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0, marginTop: 2 }}>
                        {tarihStr}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 6,
                          background: `${sablonMeta?.chipRenk || "#1e3a5f"}15`,
                          color: sablonMeta?.chipRenk || "#1e3a5f",
                        }}
                      >
                        {sablonMeta?.ad || a.sablon}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 6,
                          background: "#f1f5f9",
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        {sablonMeta?.etiket || "Şablon"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => onYukle(a)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 700,
                          border: "none",
                          background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a9e 100%)",
                          color: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                        }}
                      >
                        <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                        Yükle
                      </button>

                      <button
                        onClick={() => onSil(a.id)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 700,
                          border: "1.5px solid #fee2e2",
                          background: "#fff",
                          color: "#dc2626",
                          cursor: "pointer",
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const [kullanici, setKullanici] = useState<KullaniciBilgisi | null | undefined>(undefined);
  const [form, setForm] = useState<FormData>(baslangicForm);
  const [seciliSablon, setSeciliSablon] = useState<SablonTuru>("akademik");
  const [aktifSekme, setAktifSekme] = useState<"form" | "onizleme" | "yonetim">("form");
  const [indiriliyor, setIndiriliyor] = useState(false);
  const [pdfYukleniyor, setPdfYukleniyor] = useState(false);
  const [metinDuzenlendi, setMetinDuzenlendi] = useState(false);
  const [afislerAcik, setAfislerAcik] = useState(false);
  const [afisler, setAfisler] = useState<KayitliAfis[]>([]);
  const [afislerYukleniyor, setAfislerYukleniyor] = useState(false);
  const [destekAcik, setDestekAcik] = useState(false);

  const downloadRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const adim2Ref = useRef<(() => void) | undefined>(undefined);
  const [zoom, setZoom] = useState(1);
  const [captureSnapshot, setCaptureSnapshot] = useState<{ form: FormData; sablon: SablonTuru } | null>(null);
  const captureResolveFn = useRef<(() => void) | null>(null);

  useEffect(() => {
    api.me().then((r) => setKullanici(r.user)).catch(() => setKullanici(null));
  }, []);

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

  const afisleriYukle = useCallback(async () => {
    setAfislerYukleniyor(true);
    try {
      const r = await api.afisleriGetir();
      setAfisler(r.posters);
    } catch {
    } finally {
      setAfislerYukleniyor(false);
    }
  }, []);

  const afislerAc = useCallback(async () => {
    setAfislerAcik(true);
    afisleriYukle();
  }, [afisleriYukle]);

  const afisYukle = useCallback((a: KayitliAfis) => {
    try {
      const fd = JSON.parse(a.formData) as FormData;
      setForm(fd);
      setSeciliSablon(a.sablon as SablonTuru);
      setMetinDuzenlendi(true);
      setAfislerAcik(false);
    } catch {}
  }, []);

  const afisSil = useCallback(async (id: number) => {
    try {
      await api.afisSil(id);
      setAfisler((p) => p.filter((a) => a.id !== id));
    } catch {}
  }, []);

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

  if (kullanici === null) return <GirisEkrani onGiris={(k) => setKullanici(k)} />;

  const PaylasBtnlari = () => (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        onClick={afisiIndir}
        disabled={indiriliyor}
        className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a9e 100%)",
          border: "none",
          cursor: "pointer",
          flex: 1,
          padding: "12px 8px",
          borderRadius: 16,
          fontSize: 13,
          fontWeight: 700,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
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
        style={{
          flex: 1,
          padding: "12px 8px",
          borderRadius: 16,
          fontSize: 13,
          fontWeight: 700,
          border: "none",
          background: "#ef4444",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
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
        style={{
          flex: 1,
          padding: "12px 8px",
          borderRadius: 16,
          fontSize: 13,
          fontWeight: 700,
          border: "none",
          background: "#16a34a",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
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

          <button
            onClick={afislerAc}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{
              background: "rgba(255,255,255,0.15)",
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
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            Afişlerim
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
              onAfisKaydet={afisleriYukle}
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
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#64748b" }}>
                Canlı Önizleme
              </h2>
              <div
                className="rounded-2xl overflow-hidden mb-4"
                style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
              >
                <OnizlemeIcerik form={form} sablon={seciliSablon} />
              </div>
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
            <div className="p-4 pb-6">
              <FormAlani
                form={form}
                setForm={setForm}
                seciliSablon={seciliSablon}
                setSeciliSablon={setSeciliSablon}
                onMetinYenile={yeniMetinUret}
                setMetinDuzenlendi={setMetinDuzenlendi}
                kullaniciId={kullanici.id}
                onAfisKaydet={afisleriYukle}
                adim2Ref={adim2Ref}
              />
            </div>
          </div>
        )}

        {aktifSekme === "onizleme" && (
          <div className="flex-1 overflow-y-auto" style={{ background: "#e8edf2" }}>
            <div className="p-4 flex flex-col gap-4">
              <div ref={wrapperRef} style={{ width: "100%" }}>
                <div style={{ zoom } as React.CSSProperties}>
                  <div style={{ width: POSTER_W }}>
                    <OnizlemeIcerik form={form} sablon={seciliSablon} />
                  </div>
                </div>
              </div>
              <PaylasBtnlari />
              <p className="text-center text-xs" style={{ color: "#94a3b8" }}>
                iPhone: görsel yeni sekmede açılır → basılı tutarak "Görseli Kaydet"
              </p>
            </div>
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
            <OnizlemeIcerik form={captureSnapshot.form} sablon={captureSnapshot.sablon} />
          </div>
        </div>
      )}

      <nav
        className="lg:hidden flex-shrink-0 flex border-t border-slate-200"
        style={{ background: "#ffffff", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {(["form", "onizleme"] as const).map((sekme) => (
          <button
            key={sekme}
            onClick={() => {
              if (sekme === "form" && aktifSekme === "onizleme") adim2Ref.current?.();
              setAktifSekme(sekme);
            }}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors"
            style={{
              color: aktifSekme === sekme ? "#1d4ed8" : "#94a3b8",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {sekme === "form" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={aktifSekme === sekme ? 2.5 : 1.5}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={aktifSekme === sekme ? 2.5 : 1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
            <span className="text-xs font-semibold">{sekme === "form" ? "Form" : "Önizleme"}</span>
          </button>
        ))}

        <button
          onClick={afislerAc}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors"
          style={{ color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
          <span className="text-xs font-semibold">Afişlerim</span>
        </button>

        {kullanici?.isAdmin && (
          <button
            onClick={() => setAktifSekme("yonetim")}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors"
            style={{
              color: aktifSekme === "yonetim" ? "#7c3aed" : "#94a3b8",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={aktifSekme === "yonetim" ? 2.5 : 1.5}
                d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z"
              />
            </svg>
            <span className="text-xs font-semibold">Yönetim</span>
          </button>
        )}

        <button
          onClick={() => setDestekAcik(true)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors"
          style={{ color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <span className="text-xs font-semibold">Destek</span>
        </button>
      </nav>

      {afislerAcik && (
        <AfislerPaneli
          afisler={afisler}
          yukleniyor={afislerYukleniyor}
          onKapat={() => setAfislerAcik(false)}
          onYukle={afisYukle}
          onSil={afisSil}
        />
      )}

      {destekAcik && <DestekModal onKapat={() => setDestekAcik(false)} kullanici={kullanici} />}
    </div>
  );
}

export default function App() {
  return <MainApp />;
}