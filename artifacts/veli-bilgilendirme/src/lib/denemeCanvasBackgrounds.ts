/** Hazır canvas arka planları — yalnızca Deneme sınavı manuel editör. */

export type CanvasBgCategory =
  | "egitim"
  | "deneme_sinavi"
  | "kurumsal"
  | "odul_basarim"
  | "genclik"
  | "minimal"
  | "koyu"
  | "kampanya";

export type CanvasBgPreset = {
  id: string;
  label: string;
  category: CanvasBgCategory;
  /** Tam `background` CSS değeri (gradient / çoklu katman). */
  css: string;
};

const CAT: Record<string, CanvasBgCategory> = {
  e: "egitim",
  d: "deneme_sinavi",
  k: "kurumsal",
  o: "odul_basarim",
  g: "genclik",
  m: "minimal",
  ko: "koyu",
  ka: "kampanya",
};

export const CANVAS_BG_CATEGORY_LABEL: Record<CanvasBgCategory, string> = {
  egitim: "Eğitim",
  deneme_sinavi: "Deneme sınavı",
  kurumsal: "Kurumsal",
  odul_basarim: "Ödül / başarı",
  genclik: "Gençlik",
  minimal: "Minimal",
  koyu: "Koyu tema",
  kampanya: "Renkli kampanya",
};

/** 32+ benzersiz görünümlü arka planlar. */
export const CANVAS_BG_PRESETS: CanvasBgPreset[] = [
  { id: "paper-white", label: "Temiz beyaz", category: CAT.m, css: "linear-gradient(180deg,#ffffff 0%,#f1f5f9 100%)" },
  { id: "paper-ruled", label: "Çizgili defter", category: CAT.d, css: "repeating-linear-gradient(0deg,transparent,transparent 11px,#e2e8f0 11px,#e2e8f0 12px),linear-gradient(180deg,#fafafa,#eef2f7)" },
  { id: "exam-soft", label: "Sınav kağıdı", category: CAT.d, css: "linear-gradient(135deg,#f8fafc 0%,#e2e8f0 40%,#cbd5e1 100%)" },
  { id: "grid-blue", label: "Mavi ızgara", category: CAT.e, css: "linear-gradient(90deg,rgba(59,130,246,.06) 1px,transparent 1px),linear-gradient(rgba(59,130,246,.06) 1px,transparent 1px),#f8fafc;background-size:24px 24px,24px 24px,100%" },
  { id: "chalk-green", label: "Tahta yeşili", category: CAT.e, css: "linear-gradient(145deg,#14532d 0%,#166534 50%,#052e16 100%)" },
  { id: "library-warm", label: "Kütüphane sıcak", category: CAT.e, css: "linear-gradient(160deg,#fef3c7 0%,#fde68a 35%,#d97706 100%)" },
  { id: "notebook-margin", label: "Not defteri", category: CAT.d, css: "linear-gradient(90deg,#fecaca 0%,#fecaca 3%,transparent 3%),linear-gradient(180deg,#fffbeb,#fef9c3)" },
  { id: "pencil-hatch", label: "Tarama çizgisi", category: CAT.d, css: "repeating-linear-gradient(-12deg,#e0e7ff,#e0e7ff 8px,#eef2ff 8px,#eef2ff 16px)" },
  { id: "corporate-navy", label: "Kurumsal lacivert", category: CAT.k, css: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 45%,#1e40af 100%)" },
  { id: "corporate-slate", label: "Gri kurumsal", category: CAT.k, css: "linear-gradient(180deg,#334155 0%,#1e293b 100%)" },
  { id: "blue-glass", label: "Mavi cam", category: CAT.k, css: "linear-gradient(135deg,#0ea5e9 0%,#0369a1 50%,#0c4a6e 100%)" },
  { id: "stripe-corporate", label: "Çizgili kurumsal", category: CAT.k, css: "repeating-linear-gradient(90deg,#1e3a5f,#1e3a5f 18px,#0f172a 18px,#0f172a 36px)" },
  { id: "gold-premium", label: "Premium altın", category: CAT.o, css: "linear-gradient(135deg,#422006 0%,#a16207 40%,#fbbf24 85%)" },
  { id: "trophy-amber", label: "Ödül amber", category: CAT.o, css: "radial-gradient(ellipse at 30% 20%,#fcd34d 0%,transparent 50%),linear-gradient(180deg,#451a03,#78350f)" },
  { id: "success-emerald", label: "Başarı zümrüt", category: CAT.o, css: "linear-gradient(160deg,#022c22 0%,#047857 55%,#34d399 100%)" },
  { id: "confetti-soft", label: "Konfeti yumuşak", category: CAT.o, css: "radial-gradient(circle at 20% 30%,rgba(251,191,36,.35) 0%,transparent 25%),radial-gradient(circle at 80% 20%,rgba(236,72,153,.25) 0%,transparent 22%),linear-gradient(180deg,#fff7ed,#ffedd5)" },
  { id: "youth-purple", label: "Mor gençlik", category: CAT.g, css: "linear-gradient(135deg,#4c1d95 0%,#7c3aed 40%,#c084fc 100%)" },
  { id: "youth-cyan", label: "Turkuaz gençlik", category: CAT.g, css: "linear-gradient(120deg,#164e63 0%,#06b6d4 50%,#67e8f9 100%)" },
  { id: "youth-lime", label: "Lime enerji", category: CAT.g, css: "linear-gradient(145deg,#365314 0%,#84cc16 50%,#ecfccb 100%)" },
  { id: "wave-soft", label: "Yumuşak dalga", category: CAT.m, css: "radial-gradient(ellipse 120% 80% at 50% -20%,#bfdbfe 0%,transparent 55%),linear-gradient(180deg,#f8fafc,#e2e8f0)" },
  { id: "mesh-lavender", label: "Lavanta mesh", category: CAT.m, css: "radial-gradient(at 0% 0%,rgba(167,139,250,.45) 0%,transparent 50%),radial-gradient(at 100% 100%,rgba(96,165,250,.4) 0%,transparent 45%),#faf5ff" },
  { id: "dots-subtle", label: "Nokta desen", category: CAT.m, css: "radial-gradient(circle,#cbd5e1 1px,transparent 1.5px),#ffffff;background-size:14px 14px" },
  { id: "carbon-dark", label: "Karbon koyu", category: CAT.ko, css: "repeating-linear-gradient(45deg,#171717,#171717 6px,#262626 6px,#262626 12px)" },
  { id: "midnight-blue", label: "Gece mavisi", category: CAT.ko, css: "linear-gradient(180deg,#020617 0%,#1e3a8a 100%)" },
  { id: "oled-black", label: "Saf siyah", category: CAT.ko, css: "linear-gradient(180deg,#000000,#0a0a0a)" },
  { id: "deep-teal", label: "Derin teal", category: CAT.ko, css: "linear-gradient(135deg,#042f2e 0%,#115e59 60%,#134e4a 100%)" },
  { id: "orange-burst", label: "Turuncu patlama", category: CAT.ka, css: "radial-gradient(circle at 70% 30%,#fb923c 0%,transparent 45%),linear-gradient(135deg,#7c2d12,#ea580c)" },
  { id: "magenta-pop", label: "Macenta pop", category: CAT.ka, css: "linear-gradient(120deg,#831843 0%,#db2777 50%,#f472b6 100%)" },
  { id: "sunset-campaign", label: "Gün batımı", category: CAT.ka, css: "linear-gradient(135deg,#f97316 0%,#ec4899 50%,#8b5cf6 100%)" },
  { id: "citrus-fresh", label: "Narenciye", category: CAT.ka, css: "linear-gradient(160deg,#fef08a 0%,#facc15 40%,#ea580c 100%)" },
  { id: "ocean-waves", label: "Okyanus dalgası", category: CAT.e, css: "radial-gradient(ellipse 100% 50% at 50% 100%,#0ea5e9 0%,transparent 55%),linear-gradient(180deg,#ecfeff,#bae6fd)" },
  { id: "abstract-blobs", label: "Soyut lekeler", category: CAT.m, css: "radial-gradient(circle at 15% 25%,rgba(99,102,241,.35) 0%,transparent 28%),radial-gradient(circle at 85% 75%,rgba(14,165,233,.3) 0%,transparent 30%),#f8fafc" },
  { id: "hex-tech", label: "Teknoloji petek", category: CAT.k, css: "repeating-linear-gradient(30deg,#1e293b,#1e293b 12px,#334155 12px,#334155 24px),linear-gradient(180deg,#0f172a,#1e293b)" },
  { id: "soft-rose", label: "Pudra gül", category: CAT.m, css: "linear-gradient(180deg,#fff1f2 0%,#ffe4e6 50%,#fecdd3 100%)" },
  { id: "ice-blue", label: "Buz mavisi", category: CAT.m, css: "linear-gradient(180deg,#f0f9ff 0%,#e0f2fe 100%)" },
];

// Fix category for soft-rose - used string "minimal" wrong key - CAT.minimal is 'minimal'
// I used CAT.minimal for soft-rose but wrote category: CAT.minimal - need fix soft-rose category
// CANVAS_BG_CATEGORY_LABEL has key minimal - CAT.m is minimal - good

export function canvasPresetById(id: string | null): CanvasBgPreset | undefined {
  if (!id) return undefined;
  return CANVAS_BG_PRESETS.find((p) => p.id === id);
}
