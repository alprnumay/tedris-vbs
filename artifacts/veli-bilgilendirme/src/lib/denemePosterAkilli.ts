import { odulAkilliGridSinifi } from "@/lib/denemeLayoutIntelligence";
import { bolumKatmani, normalizeOncelikler, oncelikToBolum } from "@/lib/denemeOncelikMotor";
import type { BolumAnahtari, DenemeSinaviFormData, OncelikOgesi } from "@/types/denemeSinavi";
import { afisGorselDizisi } from "@/types/denemeSinavi";

export type OdulSunumTarzi = "kartlar" | "baslikListe" | "badge" | "cekilisOdak";

export type YerlesimSonuc = {
  odulGridSinifi: string;
  odulSunum: OdulSunumTarzi;
  odulCarousel: boolean;
};

function odulSayisi(d: DenemeSinaviFormData): number {
  const havuzN = d.havuzOgeleri.filter((x) => x.ad.trim()).length;
  const odulN = d.oduller.length;
  if (d.odulModeli === "ilkX" && odulN === 0) return Math.max(havuzN, 0);
  if (d.odulModeli === "cekilis" && odulN === 0) return Math.max(havuzN, 1);
  return odulN;
}

export function hesaplaYerlesim(d: DenemeSinaviFormData): YerlesimSonuc {
  const n = odulSayisi(d);
  const grid = odulAkilliGridSinifi(n);
  const carousel = n > 6;

  switch (d.odulModeli) {
    case "sirali":
      return { odulGridSinifi: grid, odulSunum: "kartlar", odulCarousel: carousel };
    case "ilkX":
      return { odulGridSinifi: grid, odulSunum: "baslikListe", odulCarousel: carousel };
    case "katilim":
      return { odulGridSinifi: "flex w-full flex-wrap justify-center gap-2", odulSunum: "badge", odulCarousel: false };
    case "cekilis":
      return { odulGridSinifi: n <= 1 ? odulAkilliGridSinifi(1) : grid, odulSunum: "cekilisOdak", odulCarousel: carousel };
    default:
      return { odulGridSinifi: grid, odulSunum: "kartlar", odulCarousel: carousel };
  }
}

export type BolgeBoyutu = "buyuk" | "orta" | "kucuk" | "gizli";

export type OncelikSonuc = {
  qrVurgulu: boolean;
  bolge: Partial<Record<BolumAnahtari, BolgeBoyutu>>;
};

export function hesaplaOncelik(motorRaw: readonly OncelikOgesi[]): OncelikSonuc {
  const motor = normalizeOncelikler(motorRaw);
  const bolge: Partial<Record<BolumAnahtari, BolgeBoyutu>> = {};
  const rank: BolgeBoyutu[] = ["buyuk", "orta", "kucuk", "kucuk", "kucuk"];
  motor.forEach((o, i) => {
    const b = oncelikToBolum(o);
    if (i < rank.length) bolge[b] = rank[i];
  });
  const qrI = motor.indexOf("qr_kayit");
  return { bolge, qrVurgulu: qrI === 0 || qrI === 1 };
}

export function bolgeBoyutSinifi(bolum: BolumAnahtari, motor: readonly OncelikOgesi[], fallbackTier: 0 | 1 | 2 | 3 | 4 | null): string {
  const h = hesaplaOncelik(motor).bolge[bolum];
  if (h === "gizli") return "hidden";
  const t = bolumKatmani(bolum, motor);
  if (h === "buyuk") return t === 0 ? "scale-100" : "scale-[1.02] sm:scale-100";
  if (h === "orta") return "";
  if (h === "kucuk") return "opacity-95";
  if (fallbackTier != null && fallbackTier >= 3) return "origin-top scale-[0.98]";
  return "";
}

export function gorselAlanSinifi(d: DenemeSinaviFormData): string {
  const urls = afisGorselDizisi(d);
  const c = urls.length;
  if (c <= 0) return "grid grid-cols-1";
  if (c === 1) return "grid grid-cols-1 place-items-center";
  if (c === 2) return "grid grid-cols-2 gap-2";
  return "grid grid-cols-2 gap-2 sm:grid-cols-3";
}

export function gorselThumbMinH(d: DenemeSinaviFormData): string {
  const c = afisGorselDizisi(d).length;
  if (c === 1) return "120px";
  if (c === 2) return "88px";
  return c >= 4 ? "64px" : "72px";
}
