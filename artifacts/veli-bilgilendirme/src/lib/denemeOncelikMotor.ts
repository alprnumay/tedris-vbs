import { ONCELIK_MAX, type BolumAnahtari, type OncelikOgesi } from "@/types/denemeSinavi";

const LEGACY_MAP: Record<string, OncelikOgesi> = {
  oduller: "odul_hediye",
  tarih: "tarih_saat",
  kurum: "kurum_logo",
  sinif: "sinif_seviye",
  ucretsiz: "ucretsiz_katilim",
};

const TUM_ONCELIKLER: readonly OncelikOgesi[] = [
  "odul_hediye",
  "tarih_saat",
  "kurum_logo",
  "sinif_seviye",
  "ucretsiz_katilim",
  "kayit_basvuru",
  "kontenjan",
  "duyuru_metni",
  "iletisim",
  "adres_konum",
  "sosyal_medya",
  "qr_kayit",
] as const;

const PAD: OncelikOgesi[] = [
  "odul_hediye",
  "tarih_saat",
  "kurum_logo",
  "sinif_seviye",
  "ucretsiz_katilim",
  "kayit_basvuru",
  "duyuru_metni",
];

function coerceOncelik(x: string): OncelikOgesi {
  if (LEGACY_MAP[x]) return LEGACY_MAP[x];
  if ((TUM_ONCELIKLER as readonly string[]).includes(x)) return x as OncelikOgesi;
  return "odul_hediye";
}

/** En fazla 5 öncelik; tekrarlar atılır; eksikse doldurulur. */
export function normalizeOncelikler(raw: readonly (string | OncelikOgesi)[]): OncelikOgesi[] {
  const seen = new Set<OncelikOgesi>();
  const u: OncelikOgesi[] = [];
  for (const x of raw) {
    const c = coerceOncelik(String(x));
    if (seen.has(c)) continue;
    seen.add(c);
    u.push(c);
    if (u.length >= ONCELIK_MAX) break;
  }
  for (const p of PAD) {
    if (u.length >= ONCELIK_MAX) break;
    if (!u.includes(p)) u.push(p);
  }
  for (const p of TUM_ONCELIKLER) {
    if (u.length >= ONCELIK_MAX) break;
    if (!u.includes(p)) u.push(p);
  }
  return u.slice(0, ONCELIK_MAX);
}

export function oncelikToBolum(o: OncelikOgesi): BolumAnahtari {
  const m: Record<OncelikOgesi, BolumAnahtari> = {
    odul_hediye: "oduller",
    tarih_saat: "tarih",
    kurum_logo: "kurum",
    sinif_seviye: "sinif",
    ucretsiz_katilim: "ucretsiz",
    kayit_basvuru: "cta",
    kontenjan: "kontenjan_rozet",
    duyuru_metni: "duyuru",
    iletisim: "iletisim",
    adres_konum: "adres",
    sosyal_medya: "sosyal",
    qr_kayit: "qr",
  };
  return m[o];
}

/** Blok için en iyi (en küçük indeks) öncelik katmanı; yoksa null. */
export function bolumKatmani(bolum: BolumAnahtari, motor: readonly OncelikOgesi[]): 0 | 1 | 2 | 3 | 4 | null {
  let best: number | null = null;
  for (let i = 0; i < motor.length; i++) {
    if (oncelikToBolum(motor[i]) === bolum) {
      if (best === null || i < best) best = i;
    }
  }
  if (best === null) return null;
  if (best === 0) return 0;
  if (best === 1) return 1;
  if (best === 2) return 2;
  if (best === 3) return 3;
  return 4;
}

/** @deprecated — bolumKatmani kullanın */
export function oncelikKatmani(bolum: BolumAnahtari, motor: readonly OncelikOgesi[]): 0 | 1 | 2 | null {
  const k = bolumKatmani(bolum, motor);
  if (k === null) return null;
  if (k === 0 || k === 1 || k === 2) return k;
  return 2;
}

export function oncelikSariciSinif(k: 0 | 1 | 2 | 3 | 4 | null): string {
  if (k === 0) return "rounded-2xl border border-white/25 bg-white/5 p-3 shadow-sm md:p-4";
  if (k === 1) return "rounded-xl border border-white/15 bg-white/[0.04] p-2.5 md:p-3";
  if (k === 2) return "rounded-lg border border-white/12 bg-white/[0.03] p-2 md:p-2.5";
  if (k === 3) return "rounded-md border border-white/10 p-1.5 md:p-2 text-[0.92em]";
  if (k === 4) return "rounded-md border border-white/8 p-1.5 text-[0.88em] opacity-[0.96]";
  return "";
}

/** Çok öncelik seçildiğinde genel ölçek (taşmayı azaltır). */
export function oncelikGenelOlcek(motorLen: number): string {
  if (motorLen >= 5) return "text-[0.92em]";
  if (motorLen >= 4) return "text-[0.95em]";
  return "";
}
