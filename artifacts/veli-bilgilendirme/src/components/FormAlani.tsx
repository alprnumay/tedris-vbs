import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FormData, SablonTuru, Faaliyet } from "../types";
import { api, type KayitliProfil } from "../lib/api";
import { baslikAlternatifleri } from "../lib/dil";
import { SABLON_LISTESI, SABLON_GORSEL_LIMITLERI, TEMALI_LAYOUT } from "../lib/sablonlar";
import {
  ALAN_YARDIM,
  FAALIYET_TURLERI,
  GORSEL_YERLESIM,
  METIN_TON_ACIKLAMA,
  METIN_UZUNLUK_ACIKLAMA,
  hizliOrnekForm,
} from "../lib/veli/veliFormYardimMetinleri";
import { inputStyle, labelStyle, primaryBtn, secondaryBtn } from "../lib/veli/veliMobilStil";
import { gorselBoyutOku, dikeyGorselSablonOner } from "../lib/veli/gorselOrientasyon";
import { InfoTip } from "./veli/InfoTip";
import { FormAkordeon } from "./veli/FormAkordeon";
import { VeliCanliOnizleme } from "./veli/VeliCanliOnizleme";

interface Props {
  form: FormData;
  setForm: (f: FormData) => void;
  seciliSablon: SablonTuru;
  setSeciliSablon: (s: SablonTuru) => void;
  onMetinYenile: () => void;
  setMetinDuzenlendi: (v: boolean) => void;
  kullaniciId?: string;
  adim2Ref?: React.MutableRefObject<(() => void) | undefined>;
  mobilMod?: boolean;
  desktopMod?: boolean;
  onTasarimaGec?: () => void;
  onAdimChange?: (adim: 1 | 2) => void;
}

function dosyayaBase64Cevir(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AlanEtiketi({ label, ipucu }: { label: string; ipucu?: string }) {
  return (
    <label style={labelStyle}>
      {label}
      {ipucu ? <InfoTip metin={ipucu} /> : null}
    </label>
  );
}

const stepEase = [0.22, 1, 0.36, 1] as const;

/* ─── Mini SVG Thumbnail per Template ─── */
function SablonMiniThumbnail({ id, renk }: { id: SablonTuru; renk: string }) {
  const w = 64, h = 84;

  if (id === "akademik") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ borderRadius: 6, overflow: "hidden", display: "block" }}>
      <rect width={w} height={h} fill="#f8fafc" />
      <rect width={w} height={26} fill={renk} />
      <rect x={6} y={5} width={36} height={4} rx={1} fill="white" opacity={0.9} />
      <rect x={6} y={12} width={24} height={3} rx={1} fill="white" opacity={0.55} />
      <rect x={6} y={19} width={30} height={2} rx={1} fill="white" opacity={0.35} />
      <rect x={6} y={30} width={52} height={14} rx={2} fill="#e2e8f0" />
      <rect x={6} y={48} width={52} height={2} rx={1} fill="#94a3b8" />
      <rect x={6} y={53} width={40} height={2} rx={1} fill="#94a3b8" />
      <rect x={6} y={58} width={46} height={2} rx={1} fill="#94a3b8" />
      <rect x={6} y={63} width={36} height={2} rx={1} fill="#cbd5e1" />
      <rect width={w} height={8} y={76} fill={renk} opacity={0.7} />
    </svg>
  );

  if (id === "etkinlik") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ borderRadius: 6, display: "block" }}>
      <rect width={w} height={h} fill="#f0fdf4" />
      <rect width={w} height={30} fill={renk} />
      <polygon points={`0,30 ${w},22 ${w},30`} fill="rgba(0,0,0,0.12)" />
      <rect x={6} y={5} width={38} height={4} rx={1} fill="white" opacity={0.9} />
      <rect x={6} y={13} width={26} height={3} rx={1} fill="white" opacity={0.6} />
      <rect x={6} y={20} width={20} height={2} rx={1} fill="white" opacity={0.4} />
      <rect x={6} y={35} width={52} height={12} rx={2} fill="#dcfce7" />
      <rect x={6} y={51} width={52} height={2} rx={1} fill={renk} opacity={0.4} />
      <rect x={6} y={56} width={38} height={2} rx={1} fill="#94a3b8" />
      <rect x={6} y={61} width={44} height={2} rx={1} fill="#94a3b8" />
      <rect x={6} y={70} width={52} height={10} rx={2} fill="#f0fdf4" />
      <rect x={8} y={73} width={30} height={2} rx={1} fill={renk} opacity={0.5} />
    </svg>
  );

  if (id === "bulten") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ borderRadius: 6, display: "block" }}>
      <rect width={w} height={h} fill="#fffbeb" />
      <path d={`M0,0 L${w},0 L${w},22 Q${w / 2},34 0,22 Z`} fill={renk} />
      <rect x={6} y={5} width={36} height={4} rx={1} fill="white" opacity={0.9} />
      <rect x={6} y={13} width={22} height={3} rx={1} fill="white" opacity={0.6} />
      <rect x={4} y={37} width={26} height={18} rx={2} fill="#fef3c7" />
      <rect x={34} y={37} width={26} height={18} rx={2} fill="#fef3c7" />
      <rect x={4} y={59} width={26} height={18} rx={2} fill="#fef3c7" />
      <rect x={34} y={59} width={26} height={18} rx={2} fill="#fef3c7" />
      <rect x={7} y={41} width={16} height={2} rx={1} fill={renk} opacity={0.5} />
      <rect x={7} y={45} width={12} height={2} rx={1} fill="#94a3b8" />
      <rect x={37} y={41} width={16} height={2} rx={1} fill={renk} opacity={0.5} />
      <rect x={37} y={45} width={12} height={2} rx={1} fill="#94a3b8" />
    </svg>
  );

  if (["lacivert", "mor", "kirmizi", "turuncu", "pembe", "teal", "altin"].includes(id)) {
    const layout = TEMALI_LAYOUT[id as SablonTuru] ?? "klasik";
    if (layout === "sidebar") return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ borderRadius: 6, display: "block" }}>
        <rect width={w} height={h} fill="#f8fafc" />
        <rect width={18} height={h} fill={renk} />
        <circle cx={9} cy={18} r={5} fill="white" opacity={0.25} />
        <circle cx={9} cy={36} r={3.5} fill="white" opacity={0.18} />
        <circle cx={9} cy={52} r={2.5} fill="white" opacity={0.12} />
        <circle cx={9} cy={66} r={2} fill="white" opacity={0.1} />
        <rect x={24} y={8} width={32} height={4} rx={1} fill="#1e293b" />
        <rect x={24} y={15} width={22} height={2} rx={1} fill="#64748b" />
        <rect x={22} y={22} width={36} height={16} rx={2} fill="#e2e8f0" />
        <rect x={24} y={42} width={32} height={2} rx={1} fill="#94a3b8" />
        <rect x={24} y={47} width={26} height={2} rx={1} fill="#94a3b8" />
        <rect x={24} y={52} width={30} height={2} rx={1} fill="#94a3b8" />
        <rect x={24} y={66} width={18} height={10} rx={2} fill={renk} opacity={0.25} />
      </svg>
    );
    if (layout === "karti") return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ borderRadius: 6, display: "block" }}>
        <rect width={w} height={h} fill="#ffffff" />
        <rect width={w} height={6} fill={renk} />
        <circle cx={8} cy={16} r={3} fill={renk} />
        <rect x={14} y={14} width={32} height={4} rx={1} fill="#1e293b" />
        <rect x={4} y={24} width={48} height={2} rx={1} fill="#e2e8f0" />
        <rect x={4} y={29} width={30} height={2} rx={1} fill="#94a3b8" />
        <rect x={4} y={36} width={56} height={16} rx={2} fill="#e2e8f0" />
        <rect x={4} y={56} width={24} height={8} rx={4} fill={renk} opacity={0.18} />
        <rect x={32} y={57} width={20} height={6} rx={3} fill={renk} opacity={0.12} />
        <rect x={4} y={68} width={56} height={2} rx={1} fill="#94a3b8" />
        <rect x={4} y={73} width={36} height={2} rx={1} fill="#94a3b8" />
        <rect x={4} y={78} width={28} height={2} rx={1} fill="#cbd5e1" />
      </svg>
    );
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ borderRadius: 6, display: "block" }}>
        <rect width={w} height={h} fill="#f8fafc" />
        <rect width={w} height={26} fill={renk} />
        <rect x={6} y={5} width={36} height={4} rx={1} fill="white" opacity={0.9} />
        <rect x={6} y={12} width={24} height={3} rx={1} fill="white" opacity={0.55} />
        <rect x={6} y={18} width={30} height={2} rx={1} fill="white" opacity={0.35} />
        <rect x={6} y={30} width={52} height={14} rx={2} fill="#e2e8f0" />
        <rect x={6} y={48} width={52} height={2} rx={1} fill="#94a3b8" />
        <rect x={6} y={53} width={40} height={2} rx={1} fill="#94a3b8" />
        <rect x={6} y={58} width={46} height={2} rx={1} fill="#94a3b8" />
        <rect x={6} y={66} width={20} height={8} rx={4} fill={renk} opacity={0.3} />
        <rect width={w} height={7} y={77} fill={renk} opacity={0.6} />
      </svg>
    );
  }

  if (id === "premium-minimal") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ borderRadius: 6, display: "block" }}>
      <rect width={w} height={h} fill="#ffffff" />
      <rect x={0} y={0} width={4} height={h} fill={renk} />
      <rect x={10} y={6} width={48} height={22} rx={3} fill="#f1f5f9" />
      <rect x={10} y={34} width={34} height={3} rx={1} fill="#334155" />
      <rect x={10} y={40} width={22} height={2} rx={1} fill={renk} />
      <rect x={10} y={47} width={44} height={2} rx={1} fill="#94a3b8" />
      <rect x={10} y={52} width={38} height={2} rx={1} fill="#94a3b8" />
      <rect x={10} y={57} width={42} height={2} rx={1} fill="#94a3b8" />
      <rect x={10} y={62} width={30} height={2} rx={1} fill="#cbd5e1" />
      <rect x={10} y={70} width={44} height={1} rx={1} fill="#e2e8f0" />
      <rect x={10} y={75} width={24} height={2} rx={1} fill="#94a3b8" />
    </svg>
  );

  if (id === "kartli-bilgi") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ borderRadius: 6, display: "block" }}>
      <rect width={w} height={h} fill="#eff6ff" />
      <rect width={w} height={24} fill={renk} />
      <rect x={6} y={6} width={38} height={4} rx={1} fill="white" opacity={0.9} />
      <rect x={6} y={14} width={26} height={3} rx={1} fill="white" opacity={0.55} />
      <rect x={4} y={28} width={56} height={14} rx={3} fill="white" />
      <rect x={7} y={31} width={7} height={7} rx={1} fill={renk} opacity={0.7} />
      <rect x={18} y={32} width={26} height={2} rx={1} fill="#334155" />
      <rect x={18} y={37} width={20} height={2} rx={1} fill="#94a3b8" />
      <rect x={4} y={46} width={56} height={14} rx={3} fill="white" />
      <rect x={7} y={49} width={7} height={7} rx={1} fill={renk} opacity={0.7} />
      <rect x={18} y={50} width={26} height={2} rx={1} fill="#334155" />
      <rect x={18} y={55} width={20} height={2} rx={1} fill="#94a3b8" />
      <rect x={4} y={64} width={56} height={14} rx={3} fill="white" />
      <rect x={7} y={67} width={7} height={7} rx={1} fill={renk} opacity={0.7} />
      <rect x={18} y={68} width={26} height={2} rx={1} fill="#334155" />
      <rect x={18} y={73} width={20} height={2} rx={1} fill="#94a3b8" />
    </svg>
  );

  if (id === "kurumsal-resmi") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ borderRadius: 6, display: "block" }}>
      <rect width={w} height={h} fill="#ffffff" />
      <rect x={2} y={2} width={w - 4} height={h - 4} fill="none" stroke="#1e293b" strokeWidth={1.5} rx={3} />
      <rect x={5} y={5} width={w - 10} height={h - 10} fill="none" stroke="#e2e8f0" strokeWidth={0.7} rx={2} />
      <rect x={8} y={10} width={14} height={12} rx={2} fill="#e2e8f0" />
      <rect x={26} y={10} width={28} height={3} rx={1} fill="#1e293b" />
      <rect x={26} y={16} width={20} height={2} rx={1} fill="#64748b" />
      <line x1={8} y1={26} x2={56} y2={26} stroke="#e2e8f0" strokeWidth={0.8} />
      <rect x={8} y={28} width={48} height={7} rx={0} fill="#f8fafc" />
      <rect x={8} y={35} width={48} height={7} rx={0} fill="white" />
      <rect x={8} y={42} width={48} height={7} rx={0} fill="#f8fafc" />
      <rect x={8} y={49} width={48} height={7} rx={0} fill="white" />
      <line x1={8} y1={56} x2={56} y2={56} stroke="#e2e8f0" strokeWidth={0.8} />
      <rect x={8} y={60} width={28} height={2} rx={1} fill="#94a3b8" />
      <rect x={8} y={65} width={20} height={2} rx={1} fill="#94a3b8" />
      <rect x={8} y={72} width={22} height={8} rx={2} fill="#1e293b" />
    </svg>
  );

  if (id === "hikaye") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ borderRadius: 6, display: "block" }}>
      <rect width={w} height={h} fill="#fdf6e3" />
      <path d={`M0,0 L${w},0 L${w},20 Q${w / 2},32 0,20 Z`} fill="#c8956c" />
      <rect x={6} y={5} width={34} height={4} rx={1} fill="white" opacity={0.9} />
      <rect x={6} y={13} width={22} height={2} rx={1} fill="white" opacity={0.6} />
      <rect x={8} y={36} width={48} height={1} rx={1} fill="#92400e" opacity={0.25} />
      <rect x={8} y={42} width={48} height={2} rx={1} fill="#92400e" opacity={0.3} />
      <rect x={8} y={47} width={40} height={2} rx={1} fill="#92400e" opacity={0.25} />
      <rect x={8} y={52} width={44} height={2} rx={1} fill="#92400e" opacity={0.25} />
      <rect x={8} y={59} width={22} height={16} rx={2} fill="#f5e6c8" />
      <rect x={34} y={59} width={22} height={16} rx={2} fill="#f5e6c8" />
      <rect x={8} y={77} width={48} height={2} rx={1} fill="#92400e" opacity={0.2} />
    </svg>
  );

  if (id === "fotograf-odakli") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ borderRadius: 6, display: "block" }}>
      <rect width={w} height={h} fill="#0f172a" />
      <rect x={3} y={3} width={27} height={36} rx={2} fill="#1e3a5f" />
      <rect x={34} y={3} width={27} height={16} rx={2} fill="#1e3a5f" />
      <rect x={34} y={23} width={27} height={16} rx={2} fill="#1e3a5f" />
      <rect x={3} y={43} width={58} height={3} rx={1} fill="#94a3b8" />
      <rect x={3} y={50} width={44} height={2} rx={1} fill="#64748b" />
      <rect x={3} y={55} width={50} height={2} rx={1} fill="#64748b" />
      <rect x={3} y={62} width={26} height={18} rx={2} fill="#1e3a5f" />
      <rect x={33} y={62} width={28} height={18} rx={2} fill="#1e3a5f" />
    </svg>
  );

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ borderRadius: 6, display: "block" }}>
      <rect width={w} height={h} fill="#f8fafc" />
      <rect width={w} height={24} fill={renk} />
      <rect x={6} y={7} width={34} height={4} rx={1} fill="white" opacity={0.9} />
      <rect x={6} y={14} width={22} height={2} rx={1} fill="white" opacity={0.55} />
      <rect x={6} y={30} width={52} height={14} rx={2} fill="#e2e8f0" />
      <rect x={6} y={48} width={52} height={2} rx={1} fill="#94a3b8" />
      <rect x={6} y={53} width={40} height={2} rx={1} fill="#94a3b8" />
    </svg>
  );
}

/* ─── Adım Göstergesi ─── */
function AdimGostergesi({
  adim,
  setAdim,
  desktopMod,
}: {
  adim: 1 | 2;
  setAdim: (a: 1 | 2) => void;
  desktopMod?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 16, position: "relative" }}>
      {([1, 2] as const).map((n) => {
        const aktif = adim === n;
        const tamamlandi = adim > n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => setAdim(n)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "11px 10px",
              borderRadius: 14,
              cursor: "pointer",
              border: "none",
              background: aktif ? "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)" : tamamlandi ? "#dbeafe" : "#f1f5f9",
              color: aktif ? "#ffffff" : tamamlandi ? "#1d4ed8" : "#94a3b8",
              fontWeight: 700,
              fontSize: 12,
              boxShadow: aktif ? "0 6px 16px rgba(37,99,235,0.28)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                flexShrink: 0,
                background: aktif ? "rgba(255,255,255,0.25)" : tamamlandi ? "#1d4ed8" : "#e2e8f0",
                color: aktif ? "#fff" : tamamlandi ? "#fff" : "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {tamamlandi ? "✓" : n}
            </div>
            {n === 1 ? "Bilgiler" : "Tasarım"}
          </button>
        );
      })}
      {!desktopMod && (
        <p style={{ position: "absolute", bottom: -18, left: 0, right: 0, textAlign: "center", fontSize: 10, color: "#94a3b8", margin: 0 }}>
          Kaydırarak adımlar arasında geçebilirsiniz
        </p>
      )}
    </div>
  );
}

export default function FormAlani({
  form, setForm, seciliSablon, setSeciliSablon,
  onMetinYenile, setMetinDuzenlendi, kullaniciId, adim2Ref,
  mobilMod = false,
  desktopMod = false,
  onTasarimaGec,
  onAdimChange,
}: Props) {
  const [adim, setAdim] = useState<1 | 2>(1);
  const [profiller, setProfiller] = useState<KayitliProfil[]>([]);
  const [profilYukleniyor, setProfilYukleniyor] = useState(false);
  const [profillerAcik, setProfillerAcik] = useState(false);
  const [baslikAcik, setBaslikAcik] = useState(false);
  const [dikeyGorselUyarisi, setDikeyGorselUyarisi] = useState<string | null>(null);
  const [acikBolum, setAcikBolum] = useState<string>("kimlik");
  const touchRef = useRef({ x: 0, y: 0 });

  const adimDegistir = useCallback((yeni: 1 | 2) => {
    setAdim(yeni);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (yeni === 2) setAcikBolum("sablon");
    else setAcikBolum("kimlik");
  }, []);

  const bolumToggle = (id: string) => {
    setAcikBolum((prev) => (prev === id ? "" : id));
  };

  useEffect(() => {
    if (!desktopMod) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [adim, desktopMod]);

  useEffect(() => {
    onAdimChange?.(adim);
  }, [adim, onAdimChange]);

  useEffect(() => {
    if (!kullaniciId) return;
    setProfilYukleniyor(true);
    api.profilleriGetir().then((r) => setProfiller(r.profiles)).catch(() => {}).finally(() => setProfilYukleniyor(false));
  }, [kullaniciId]);

  useEffect(() => {
    if (adim2Ref) adim2Ref.current = () => adimDegistir(2);
  }, [adim2Ref, adimDegistir]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    if (Math.abs(dx) < 56 || Math.abs(dy) > Math.abs(dx) * 0.8) return;
    if (dx < 0 && adim === 1) adimDegistir(2);
    if (dx > 0 && adim === 2) adimDegistir(1);
  };

  const update = (key: keyof FormData, val: string | number) => setForm({ ...form, [key]: val });

  const updateFaaliyet = (idx: number, key: keyof Faaliyet, val: string) => {
    const yeni = form.faaliyetler.map((f, i) => i === idx ? { ...f, [key]: val } : f);
    setForm({ ...form, faaliyetler: yeni });
  };

  const faaliyetEkle = () => {
    if (form.faaliyetSayisi >= 3) return;
    const padded = [...form.faaliyetler];
    while (padded.length <= form.faaliyetSayisi) padded.push({ tur: "", alan: "", ozelNot: "" });
    setForm({ ...form, faaliyetSayisi: form.faaliyetSayisi + 1, faaliyetler: padded });
  };

  const faaliyetKaldir = (idx: number) => {
    if (form.faaliyetSayisi <= 1) return;
    const yeni = form.faaliyetler.filter((_, i) => i !== idx);
    while (yeni.length < 3) yeni.push({ tur: "", alan: "", ozelNot: "" });
    setForm({ ...form, faaliyetSayisi: form.faaliyetSayisi - 1, faaliyetler: yeni });
  };

  const profilYukle = (p: KayitliProfil) => {
    setForm({ ...form, isim: p.isim, kurumAdi: p.kurumAdi, rol: p.rol });
    setProfillerAcik(false);
  };

  const profilKaydet = async () => {
    if (!form.isim && !form.kurumAdi && !form.rol) return;
    try {
      const r = await api.profilKaydet({ isim: form.isim, kurumAdi: form.kurumAdi, rol: form.rol });
      setProfiller((prev) => [r.profile, ...prev].slice(0, 5));
    } catch {}
  };

  const profilSil = async (id: string) => {
    try {
      await api.profilSil(id);
      setProfiller((prev) => prev.filter((p) => p.id !== id));
    } catch {}
  };

  const maxGorsel = SABLON_GORSEL_LIMITLERI[seciliSablon] ?? 4;

  const gorselEkle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const eklenecek = Math.min(files.length, maxGorsel - form.gorseller.length);
    if (eklenecek <= 0) return;
    const yeni: string[] = [];
    let dikeyBulundu = false;
    for (let i = 0; i < eklenecek; i++) {
      const b64 = await dosyayaBase64Cevir(files[i]);
      yeni.push(b64);
      const boyut = await gorselBoyutOku(b64);
      if (boyut.dikey) dikeyBulundu = true;
    }
    setForm({ ...form, gorseller: [...form.gorseller, ...yeni] });
    if (dikeyBulundu) {
      const oneri = dikeyGorselSablonOner(seciliSablon);
      setDikeyGorselUyarisi(
        oneri
          ? "Dikey görsel algılandı. Bu şablonda yatay görseller daha iyi görünür. Sizin için uygun düzen önerildi."
          : "Dikey görsel algılandı. Yatay veya kare fotoğraflar afişte daha dengeli görünür.",
      );
      if (oneri) setSeciliSablon(oneri);
    }
    e.target.value = "";
  };

  const gorselSil = (idx: number) => setForm({ ...form, gorseller: form.gorseller.filter((_, i) => i !== idx) });
  const gorselYukariTasi = (idx: number) => {
    if (idx === 0) return;
    const yeni = [...form.gorseller];
    [yeni[idx - 1], yeni[idx]] = [yeni[idx], yeni[idx - 1]];
    setForm({ ...form, gorseller: yeni });
  };
  const gorselAsagiTasi = (idx: number) => {
    if (idx >= form.gorseller.length - 1) return;
    const yeni = [...form.gorseller];
    [yeni[idx], yeni[idx + 1]] = [yeni[idx + 1], yeni[idx]];
    setForm({ ...form, gorseller: yeni });
  };

  const basliklar = baslikAlternatifleri(form);
  const gorselAsimiVar = form.gorseller.length > maxGorsel;
  const alternatifSablon = SABLON_LISTESI.find((s) => s.maxGorsel >= form.gorseller.length && s.id !== seciliSablon);

  /* ─── ADIM 1 ─── */
  const adim1 = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      <button
        type="button"
        onClick={() => {
          setMetinDuzenlendi(false);
          setForm(hizliOrnekForm());
          onMetinYenile();
        }}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: 14,
          border: "1px solid #fde68a",
          background: "#fffbeb",
          color: "#92400e",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        ⚡ Hızlı örnek doldur
      </button>

      <FormAkordeon id="profil" baslik="Kayıtlı profil (isteğe bağlı)" acik={acikBolum === "profil"} onToggle={bolumToggle}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" onClick={profilKaydet}
            style={{ padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", cursor: "pointer" }}>
            Profili kaydet
          </button>
          {profiller.length > 0 && (
            <button type="button" onClick={() => setProfillerAcik(!profillerAcik)}
              style={{ padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "1px solid #e2e8f0", background: "#eff6ff", color: "#1d4ed8", cursor: "pointer" }}>
              Kayıtlıları {profillerAcik ? "gizle" : "göster"}
            </button>
          )}
        </div>
        {profilYukleniyor && <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Yükleniyor...</p>}
        {profillerAcik && profiller.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {profiller.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <button type="button" onClick={() => profilYukle(p)} style={{ flex: 1, textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{p.isim || "—"}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{[p.kurumAdi, p.rol].filter(Boolean).join(" · ")}</div>
                </button>
                <button type="button" onClick={() => profilSil(p.id)} style={{ width: 24, height: 24, borderRadius: "50%", background: "#fee2e2", color: "#dc2626", border: "none", fontSize: 14, cursor: "pointer" }}>×</button>
              </div>
            ))}
          </div>
        )}
      </FormAkordeon>

      <FormAkordeon id="kimlik" baslik="Kimlik Bilgileri" acik={acikBolum === "kimlik"} onToggle={bolumToggle} zorunlu>
        <div>
          <AlanEtiketi label={ALAN_YARDIM.isim.label} ipucu={ALAN_YARDIM.isim.aciklama} />
          <input type="text" value={form.isim} onChange={(e) => update("isim", e.target.value)}
            placeholder={ALAN_YARDIM.isim.placeholder} style={inputStyle} />
        </div>
        <div>
          <AlanEtiketi label={ALAN_YARDIM.kurumAdi.label} ipucu={ALAN_YARDIM.kurumAdi.aciklama} />
          <input type="text" value={form.kurumAdi} onChange={(e) => update("kurumAdi", e.target.value)}
            placeholder={ALAN_YARDIM.kurumAdi.placeholder} style={inputStyle} />
        </div>
        <div>
          <AlanEtiketi label={ALAN_YARDIM.rol.label} ipucu={ALAN_YARDIM.rol.aciklama} />
          <input type="text" value={form.rol} onChange={(e) => update("rol", e.target.value)}
            placeholder={ALAN_YARDIM.rol.placeholder} style={inputStyle} />
        </div>
      </FormAkordeon>

      <FormAkordeon id="calisma" baslik="Çalışma Bilgileri" acik={acikBolum === "calisma"} onToggle={bolumToggle}>

        {Array.from({ length: form.faaliyetSayisi }).map((_, idx) => {
          const f = form.faaliyetler[idx] ?? { tur: "", alan: "", ozelNot: "" };
          return (
            <div key={idx} style={{ background: "#f8fafc", borderRadius: 14, padding: "14px 12px", border: "1.5px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                  {form.faaliyetSayisi > 1 ? `${idx + 1}. Faaliyet` : "Faaliyet"}
                </span>
                {idx > 0 && (
                  <button onClick={() => faaliyetKaldir(idx)}
                    style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: "1px solid #fecaca", background: "#fff", color: "#dc2626", cursor: "pointer" }}>
                    Kaldır
                  </button>
                )}
              </div>
              <div>
                <AlanEtiketi label={ALAN_YARDIM.faaliyetTuru.label} ipucu={ALAN_YARDIM.faaliyetTuru.aciklama} />
                <div style={{ position: "relative" }}>
                  <select value={f.tur} onChange={(e) => updateFaaliyet(idx, "tur", e.target.value)}
                    style={{ ...inputStyle, paddingRight: 36, cursor: "pointer" }}>
                    <option value="">Seçiniz...</option>
                    {FAALIYET_TURLERI.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                    <svg width={16} height={16} fill="none" stroke="#94a3b8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <AlanEtiketi label={ALAN_YARDIM.alan.label} ipucu={ALAN_YARDIM.alan.aciklama} />
                <input type="text" value={f.alan} onChange={(e) => updateFaaliyet(idx, "alan", e.target.value)}
                  placeholder={ALAN_YARDIM.alan.placeholder} style={inputStyle} />
              </div>
              <div>
                <AlanEtiketi label={ALAN_YARDIM.ozelNot.label} ipucu={ALAN_YARDIM.ozelNot.aciklama} />
                <input type="text" value={f.ozelNot} onChange={(e) => updateFaaliyet(idx, "ozelNot", e.target.value)}
                  placeholder={ALAN_YARDIM.ozelNot.placeholder} style={inputStyle} />
              </div>
            </div>
          );
        })}

        {form.faaliyetSayisi < 3 && (
          <button onClick={faaliyetEkle}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 12, border: "1.5px dashed #cbd5e1", background: "transparent", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Faaliyet Ekle
          </button>
        )}

        <div style={{ background: "#f0f4ff", border: "1px solid #c7d2fe", borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#6366f1" }}>{ALAN_YARDIM.baslik.label}</span>
                <InfoTip metin={ALAN_YARDIM.baslik.aciklama} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e1b4b", lineHeight: 1.4 }}>{basliklar[form.seciliBaslikIdx ?? 0]}</div>
            </div>
            <button onClick={() => setBaslikAcik(!baslikAcik)}
              style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", background: "#e0e7ff", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>
              {baslikAcik ? "Kapat" : "Değiştir"}
            </button>
          </div>
          {baslikAcik && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {basliklar.map((b, i) => {
                const secili = (form.seciliBaslikIdx ?? 0) === i;
                return (
                  <button key={i} onClick={() => { update("seciliBaslikIdx", i); setBaslikAcik(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, textAlign: "left", border: secili ? "2px solid #4f46e5" : "1.5px solid #c7d2fe", background: secili ? "#e0e7ff" : "#fff", cursor: "pointer" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${secili ? "#4f46e5" : "#a5b4fc"}`, background: secili ? "#4f46e5" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {secili && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: secili ? 700 : 500, color: secili ? "#3730a3" : "#475569", lineHeight: 1.4 }}>{b}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </FormAkordeon>

      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => adimDegistir(2)}
        style={primaryBtn}
      >
        Tasarıma Geç
        <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
      </motion.button>
    </div>
  );

  /* ─── ADIM 2 ─── */
  const adim2 = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      <FormAkordeon id="sablon" baslik="Şablon Seçimi" aciklama="Afişin genel görünümünü belirleyin." acik={acikBolum === "sablon"} onToggle={bolumToggle}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {SABLON_LISTESI.map((s) => {
            const secili = seciliSablon === s.id;
            return (
              <motion.button
                key={s.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => { setSeciliSablon(s.id); setDikeyGorselUyarisi(null); }}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: 6,
                  padding: "10px 8px",
                  borderRadius: 16,
                  cursor: "pointer",
                  border: secili ? `2px solid ${s.chipRenk}` : "1px solid #e8edf2",
                  background: secili ? `${s.chipRenk}10` : "#ffffff",
                  boxShadow: secili ? `0 6px 20px ${s.chipRenk}22` : "0 2px 8px rgba(15,23,42,0.04)",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <SablonMiniThumbnail id={s.id} renk={s.chipRenk} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: secili ? s.chipRenk : "#334155", lineHeight: 1.2 }}>
                  {s.ad}
                </span>
                <span style={{ fontSize: 10, color: "#64748b", lineHeight: 1.35 }}>
                  {s.kullanim || `${s.maxGorsel} görsel · ${s.etiket}`}
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, background: "#f1f5f9", color: "#64748b", padding: "2px 6px", borderRadius: 6 }}>
                    {s.maxGorsel} görsel
                  </span>
                  {(s.etiketler ?? [s.etiket]).slice(0, 2).map((t) => (
                    <span key={t} style={{ fontSize: 9, fontWeight: 700, background: `${s.chipRenk}14`, color: s.chipRenk, padding: "2px 6px", borderRadius: 6 }}>{t}</span>
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>
      </FormAkordeon>

      <FormAkordeon id="gorseller" baslik="Görseller" aciklama="1–4 fotoğraf ekleyebilirsiniz." acik={acikBolum === "gorseller"} onToggle={bolumToggle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Yüklenen</span>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 8,
            background: gorselAsimiVar ? "#fee2e2" : form.gorseller.length === maxGorsel ? "#dcfce7" : "#f1f5f9",
            color: gorselAsimiVar ? "#dc2626" : form.gorseller.length === maxGorsel ? "#16a34a" : "#64748b",
          }}>
            {form.gorseller.length}/{maxGorsel} yüklendi
          </span>
        </div>

        <div style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", margin: "0 0 6px" }}>Fotoğraf yerleşimi</p>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: "#64748b", lineHeight: 1.45 }}>
            {GORSEL_YERLESIM.map((satir) => (
              <li key={satir}>{satir}</li>
            ))}
          </ul>
        </div>

        {form.gorseller.length === 0 && (
          <p style={{ fontSize: 11, color: "#b45309", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
            Fotoğraf eklenmedi. Görselsiz şablonlar daha uygun olabilir.
          </p>
        )}

        {gorselAsimiVar && (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: "#fff7ed", border: "1px solid #fed7aa", marginBottom: 10 }}>
            <p style={{ fontSize: 12, color: "#9a3412", fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
              ⚠️ Seçili şablon <strong>{maxGorsel} görsel</strong> kullanacak — fazla görseller görünmeyecek.
              {alternatifSablon && (
                <> <button onClick={() => setSeciliSablon(alternatifSablon.id)} style={{ color: "#1d4ed8", background: "none", border: "none", fontWeight: 700, cursor: "pointer", padding: 0, textDecoration: "underline", fontSize: 12 }}>
                  {alternatifSablon.ad} deneyin
                </button> ({alternatifSablon.maxGorsel} görsel destekler).</>
              )}
            </p>
          </div>
        )}

        {form.gorseller.length < maxGorsel && (
          <label style={{ display: "block", cursor: "pointer" }}>
            <div style={{ border: "2px dashed #cbd5e1", borderRadius: 14, padding: "16px", textAlign: "center", background: "#f8fafc" }}>
              <svg width={24} height={24} fill="none" stroke="#94a3b8" viewBox="0 0 24 24" style={{ margin: "0 auto 6px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p style={{ fontSize: 13, color: "#64748b", fontWeight: 600, margin: 0 }}>Fotoğraf seç</p>
              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                {maxGorsel - form.gorseller.length} görsel daha ekleyebilirsiniz
                {form.gorseller.length === 0 && " · İlk fotoğraf kapak görsel olur"}
              </p>
            </div>
            <input type="file" accept="image/*" multiple onChange={gorselEkle} style={{ display: "none" }} />
          </label>
        )}

        {dikeyGorselUyarisi && (
          <div style={{ padding: "10px 12px", borderRadius: 12, background: "#eff6ff", border: "1px solid #bfdbfe", marginBottom: 8 }}>
            <p style={{ fontSize: 11, color: "#1e40af", fontWeight: 600, margin: 0, lineHeight: 1.45 }}>{dikeyGorselUyarisi}</p>
          </div>
        )}

        {form.gorseller.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {form.gorseller.map((g, i) => {
              const kullanilacak = i < maxGorsel;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 12,
                  background: kullanilacak ? "#f8fafc" : "#fef2f2",
                  border: `1.5px solid ${kullanilacak ? "#e2e8f0" : "#fecaca"}`,
                  opacity: kullanilacak ? 1 : 0.7,
                }}>
                  <img src={g} alt={`Görsel ${i + 1}`} style={{ width: 50, height: 50, objectFit: "cover", objectPosition: "center", borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: kullanilacak ? "#475569" : "#dc2626" }}>
                      {i === 0 ? "🖼️ Kapak" : kullanilacak ? `Fotoğraf ${i + 1}` : `Fotoğraf ${i + 1} — Kullanılmayacak`}
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                      {kullanilacak ? `Sıra: ${i + 1}/${Math.min(form.gorseller.length, maxGorsel)}` : "Limit aşıldı"}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <button onClick={() => gorselYukariTasi(i)} disabled={i === 0}
                      style={{ width: 26, height: 26, borderRadius: 7, background: i === 0 ? "#f1f5f9" : "#e0e7ff", color: i === 0 ? "#cbd5e1" : "#4f46e5", border: "none", fontSize: 12, cursor: i === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      ▲
                    </button>
                    <button onClick={() => gorselAsagiTasi(i)} disabled={i >= form.gorseller.length - 1}
                      style={{ width: 26, height: 26, borderRadius: 7, background: i >= form.gorseller.length - 1 ? "#f1f5f9" : "#e0e7ff", color: i >= form.gorseller.length - 1 ? "#cbd5e1" : "#4f46e5", border: "none", fontSize: 12, cursor: i >= form.gorseller.length - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      ▼
                    </button>
                  </div>
                  <button onClick={() => gorselSil(i)} style={{ width: 26, height: 26, borderRadius: "50%", background: "#fee2e2", color: "#dc2626", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
              );
            })}
          </div>
        )}
      </FormAkordeon>

      <FormAkordeon id="metin" baslik="Metin Ayarları" aciklama="Metnin uzunluğunu ve üslubunu ayarlayın." acik={acikBolum === "metin"} onToggle={bolumToggle}>
        <div>
          <label style={labelStyle}>Metin Uzunluğu</label>
          <div style={{ display: "flex", gap: 0, background: "#f1f5f9", borderRadius: 10, padding: 3 }}>
            {(["detayli", "kisa"] as const).map((uz) => {
              const secili = (form.metinUzunlugu ?? "detayli") === uz;
              return (
                <button key={uz} onClick={() => { setMetinDuzenlendi(false); update("metinUzunlugu", uz); }}
                  style={{ flex: 1, padding: "9px 8px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", background: secili ? "#fff" : "transparent", color: secili ? "#1d4ed8" : "#94a3b8", cursor: "pointer", boxShadow: secili ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                  {uz === "detayli" ? "📝 Detaylı" : "✂️ Kısa"}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 6 }}>
            {(form.metinUzunlugu ?? "detayli") === "kisa" ? METIN_UZUNLUK_ACIKLAMA.kisa : METIN_UZUNLUK_ACIKLAMA.detayli}
          </p>
        </div>
        <div>
          <label style={labelStyle}>Metin Tonu</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {([
              { id: "kurumsal", label: "🏛 Kurumsal", aciklama: METIN_TON_ACIKLAMA.kurumsal },
              { id: "sicak", label: "☀️ Sıcak", aciklama: METIN_TON_ACIKLAMA.sicak },
              { id: "aciklayici", label: "📖 Açıklayıcı", aciklama: METIN_TON_ACIKLAMA.aciklayici },
            ] as const).map(({ id, label }) => {
              const secili = (form.metinTonu ?? "kurumsal") === id;
              return (
                <button key={id} type="button" onClick={() => { setMetinDuzenlendi(false); update("metinTonu", id); }}
                  style={{ padding: "10px 4px", borderRadius: 12, fontSize: 11, fontWeight: 700, border: secili ? "2px solid #1d4ed8" : "1px solid #e2e8f0", background: secili ? "#eff6ff" : "#fff", color: secili ? "#1d4ed8" : "#64748b", cursor: "pointer", textAlign: "center" }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <AlanEtiketi label={ALAN_YARDIM.posterMetni.label} ipucu={ALAN_YARDIM.posterMetni.aciklama} />
          <button onClick={() => { setMetinDuzenlendi(false); onMetinYenile(); }}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "1.5px solid #cbd5e1", background: "#f1f5f9", color: "#475569", cursor: "pointer" }}>
            <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Yenile
          </button>
        </div>
        <textarea value={form.posterMetni}
          onChange={(e) => { setMetinDuzenlendi(true); update("posterMetni", e.target.value); }}
          rows={5} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7, fontFamily: "inherit" }} />
        </div>
      </FormAkordeon>

      {onTasarimaGec && !desktopMod ? (
        <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onTasarimaGec} style={primaryBtn}>
          Afişe Geç
        </motion.button>
      ) : null}

      <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={() => adimDegistir(1)} style={secondaryBtn}>
        <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        Bilgilere Dön
      </motion.button>
    </div>
  );

  return (
    <div
      style={{ display: "flex", flexDirection: "column", paddingBottom: mobilMod ? 8 : 0 }}
      onTouchStart={desktopMod ? undefined : onTouchStart}
      onTouchEnd={desktopMod ? undefined : onTouchEnd}
    >
      <AdimGostergesi adim={adim} setAdim={adimDegistir} desktopMod={desktopMod} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={adim}
          initial={{ opacity: 0, x: adim === 2 ? 48 : -48 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: adim === 2 ? -48 : 48 }}
          transition={{ duration: 0.22, ease: stepEase }}
        >
          {adim === 1 ? adim1 : adim2}
        </motion.div>
      </AnimatePresence>
      {mobilMod && (
        <VeliCanliOnizleme form={form} sablon={seciliSablon} onTasarimaGec={onTasarimaGec} />
      )}
    </div>
  );
}
