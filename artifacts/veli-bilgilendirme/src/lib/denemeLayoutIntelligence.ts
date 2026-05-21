import type { BolumAnahtari, DenemeSablonu, DenemeSinaviFormData, OncelikOgesi } from "@/types/denemeSinavi";
import { oncelikSariciSinif } from "@/lib/denemeOncelikMotor";
import { cn } from "@/lib/utils";

/** Şablon + öncelik motorunun birlikte verdiği yerleşim dili. */
export type PosterHizalama = "center" | "left" | "minimal";

/** Kutu sarmalayıcı agresifliği: standart = mevcut; hafif = ince çerçeve; serbest = başlık vb. çoğunlukla “floating”. */
export type PosterKutuModu = "standart" | "hafif" | "serbest";

export type PosterLayoutProfili = {
  hizalama: PosterHizalama;
  kutuModu: PosterKutuModu;
  /** İç kolon ek sınıfları */
  kolonClass: string;
  /** Mobilde CTA daha büyük dokunma alanı */
  ctaMobilBuyuk: boolean;
  /** Ödül kartlarında ince / kalın çerçeve */
  odulKartVurgu: "dolu" | "ince" | "yumusak";
};

const DAIMI_KUTU: readonly BolumAnahtari[] = ["sartlar", "alt", "qr", "kontenjan_rozet"];

export function layoutProfili(sablon: DenemeSablonu): PosterLayoutProfili {
  switch (sablon) {
    case "minimal":
    case "kurumsal-sade":
      return {
        hizalama: "minimal",
        kutuModu: "hafif",
        kolonClass: "sm:px-1",
        ctaMobilBuyuk: true,
        odulKartVurgu: "ince",
      };
    case "gorsel-odakli":
    case "enerjik-genclik":
    case "cta-odakli":
      return {
        hizalama: "center",
        kutuModu: "serbest",
        kolonClass: "",
        ctaMobilBuyuk: true,
        odulKartVurgu: "yumusak",
      };
    case "liste-odakli":
      return {
        hizalama: "center",
        kutuModu: "serbest",
        kolonClass: "sm:py-1",
        ctaMobilBuyuk: true,
        odulKartVurgu: "yumusak",
      };
    case "grid-odul":
      return {
        hizalama: "left",
        kutuModu: "standart",
        kolonClass: "",
        ctaMobilBuyuk: false,
        odulKartVurgu: "dolu",
      };
    case "qr-odakli":
      return {
        hizalama: "center",
        kutuModu: "standart",
        kolonClass: "",
        ctaMobilBuyuk: true,
        odulKartVurgu: "dolu",
      };
    case "hero-odul":
    case "premium-spotlight":
    default:
      return {
        hizalama: "center",
        kutuModu: "standart",
        kolonClass: "",
        ctaMobilBuyuk: true,
        odulKartVurgu: "dolu",
      };
  }
}

export function birincilOncelik(motor: readonly OncelikOgesi[]): OncelikOgesi | null {
  return motor[0] ?? null;
}

/** Afişte gösterilen ödül/havuz öğesi sayısı. */
export function odulGorunenSayi(d: DenemeSinaviFormData): number {
  const havuzN = d.havuzOgeleri.filter((x) => x.ad.trim()).length;
  if (d.odulModeli === "ilkX" && d.oduller.length === 0) return havuzN;
  if (d.odulModeli === "cekilis" && d.oduller.length === 0) return Math.max(havuzN, 1);
  return d.oduller.length;
}

/**
 * Ödül sayısına göre responsive grid.
 * 1: tek sütun ortalı premium; 2: iki eşit; 3: üçlü; 4–6: sıkı grid; 7+: kaydırılabilir sık grid.
 */
export function odulAkilliGridSinifi(n: number): string {
  if (n <= 0) return "grid w-full grid-cols-1";
  if (n === 1) return "grid w-full grid-cols-1 place-items-center";
  if (n === 2) return "grid w-full grid-cols-1 gap-3 sm:mx-auto sm:max-w-xl sm:grid-cols-2 sm:gap-3";
  if (n === 3) return "grid w-full grid-cols-1 gap-3 sm:mx-auto sm:max-w-3xl sm:grid-cols-3 sm:gap-3";
  if (n <= 6) return "grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3";
  return "grid max-h-[min(42vh,300px)] w-full grid-cols-2 gap-2 overflow-y-auto overscroll-contain pr-0.5 sm:grid-cols-3 sm:gap-2.5";
}

export function odulKompaktMod(n: number): boolean {
  return n >= 7;
}

/** Blok sarmalayıcı: şablon + öncelik katmanı. */
export function blokSarici(anahtar: BolumAnahtari, tier: 0 | 1 | 2 | 3 | 4 | null, mod: PosterKutuModu): string {
  if (DAIMI_KUTU.includes(anahtar)) {
    return oncelikSariciSinif(tier);
  }
  if (mod === "standart") {
    return oncelikSariciSinif(tier);
  }
  if (mod === "hafif") {
    if (tier === null) return "";
    return cn(
      "min-w-0 rounded-xl border border-slate-200/40 bg-white/40 p-2.5 shadow-sm backdrop-blur-[2px] dark:border-white/10 dark:bg-white/5",
      tier === 0 && "p-3 md:p-3.5",
    );
  }
  /* serbest */
  if (anahtar === "baslik" || anahtar === "duyuru") {
    return cn("min-w-0 max-w-full px-0.5 py-1", tier === 0 ? "sm:py-2" : "");
  }
  if (anahtar === "amac") {
    return "min-w-0 py-1";
  }
  if (anahtar === "oduller" || anahtar === "tarih" || anahtar === "kurum" || anahtar === "ucretsiz" || anahtar === "kapak") {
    if (tier === 0) return "min-w-0 w-full max-w-xl py-2 sm:max-w-2xl";
    if (tier === 1) return "min-w-0 w-full max-w-lg rounded-xl border border-white/10 bg-white/5 p-2 sm:p-3 dark:border-white/10";
    return oncelikSariciSinif(tier);
  }
  return oncelikSariciSinif(tier);
}

export function kolonHizalamaSinifi(h: PosterHizalama): string {
  if (h === "center") return "items-center text-center [&_.text-left]:text-center";
  if (h === "minimal") return "items-stretch text-left";
  return "items-stretch text-left";
}

export function baslikAkilliSinif(birincil: OncelikOgesi | null, baslikTier: 0 | 1 | 2 | 3 | 4 | null, story: boolean): string {
  const kucuk =
    birincil === "odul_hediye" ||
    birincil === "tarih_saat" ||
    birincil === "kurum_logo" ||
    birincil === "ucretsiz_katilim" ||
    birincil === "kayit_basvuru";
  if (kucuk && baslikTier !== 0) {
    return cn("text-balance font-bold leading-snug opacity-90", story ? "text-sm" : "text-xs sm:text-sm", "max-w-xl", "line-clamp-3");
  }
  return cn(
    "text-balance font-black leading-tight",
    story ? "text-xl" : "text-lg sm:text-xl",
    baslikTier === 0 && "sm:text-2xl",
    baslikTier === 3 && "text-base sm:text-lg",
    baslikTier === 4 && "text-sm sm:text-base",
    "line-clamp-4",
  );
}

export function odulKartZenginlik(profil: PosterLayoutProfili, temaOdulKart: string): string {
  if (profil.odulKartVurgu === "yumusak") {
    return cn(temaOdulKart, "border-white/25 shadow-md shadow-black/10 ring-1 ring-white/15");
  }
  if (profil.odulKartVurgu === "ince") {
    return cn(temaOdulKart, "border-slate-200/80 shadow-sm");
  }
  return temaOdulKart;
}
