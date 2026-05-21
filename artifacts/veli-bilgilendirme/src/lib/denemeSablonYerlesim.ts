import type { BolumAnahtari, DenemeSablonu, OdulModeli, OncelikOgesi } from "@/types/denemeSinavi";
import { normalizeOncelikler, oncelikToBolum } from "@/lib/denemeOncelikMotor";

export type { BolumAnahtari } from "@/types/denemeSinavi";

/** "Afişin amacı" kaldırıldı — taban sıralarda yok. */
export function sablonTabanSirasi(sablon: DenemeSablonu): BolumAnahtari[] {
  const ortakSon: BolumAnahtari[] = ["sartlar", "iletisim", "adres", "sosyal", "qr", "kontenjan_rozet", "alt"];

  switch (sablon) {
    case "hero-odul":
      return ["kurum", "baslik", "kapak", "oduller", "tarih", "sinif", "ucretsiz", "havuz", "duyuru", "cta", ...ortakSon];
    case "premium-spotlight":
      return ["baslik", "oduller", "kapak", "kurum", "tarih", "sinif", "ucretsiz", "havuz", "duyuru", "cta", ...ortakSon];
    case "grid-odul":
      return ["baslik", "oduller", "sinif", "tarih", "kurum", "kapak", "ucretsiz", "havuz", "duyuru", "cta", ...ortakSon];
    case "cta-odakli":
      return ["cta", "baslik", "kurum", "havuz", "tarih", "sinif", "oduller", "duyuru", "ucretsiz", "kapak", ...ortakSon];
    case "liste-odakli":
      return ["baslik", "havuz", "oduller", "tarih", "sinif", "kurum", "kapak", "duyuru", "cta", "ucretsiz", ...ortakSon];
    case "kurumsal-sade":
      return ["kurum", "baslik", "tarih", "sinif", "kapak", "oduller", "duyuru", "havuz", "ucretsiz", "cta", ...ortakSon];
    case "minimal":
      return ["kurum", "baslik", "tarih", "sinif", "kapak", "duyuru", "oduller", "havuz", "ucretsiz", "cta", ...ortakSon];
    case "enerjik-genclik":
      return ["baslik", "kapak", "sinif", "tarih", "oduller", "kurum", "duyuru", "havuz", "ucretsiz", "cta", ...ortakSon];
    case "qr-odakli":
      return ["kurum", "baslik", "qr", "oduller", "kapak", "tarih", "sinif", "havuz", "duyuru", "ucretsiz", "cta", ...ortakSon];
    case "gorsel-odakli":
      return ["kapak", "baslik", "cta", "tarih", "sinif", "kurum", "oduller", "duyuru", "havuz", "ucretsiz", ...ortakSon];
    default:
      return ["kurum", "baslik", "kapak", "tarih", "sinif", "oduller", "havuz", "duyuru", "ucretsiz", "cta", ...ortakSon];
  }
}

function uniqSirali(keys: BolumAnahtari[]): BolumAnahtari[] {
  const seen = new Set<BolumAnahtari>();
  const out: BolumAnahtari[] = [];
  for (const k of keys) {
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function motorSiraliBolumler(motor: readonly OncelikOgesi[]): BolumAnahtari[] {
  const out: BolumAnahtari[] = [];
  const seen = new Set<BolumAnahtari>();
  for (const o of motor) {
    const b = oncelikToBolum(o);
    if (seen.has(b)) continue;
    seen.add(b);
    out.push(b);
  }
  return out;
}

export function afisBolumSirasi(oncelikler: readonly OncelikOgesi[], sablon: DenemeSablonu): BolumAnahtari[] {
  const motor = normalizeOncelikler(oncelikler);
  const pri = motorSiraliBolumler(motor);
  const base = sablonTabanSirasi(sablon);
  const tail = base.filter((k) => !pri.includes(k));
  return uniqSirali([...pri, ...tail]).filter((k) => k !== "amac");
}

export type OdulYerlesimModu =
  | "varsayilan"
  | "spot"
  | "story-buyuk"
  | "havuz-vurgu"
  | "grid-siki"
  | "podium"
  | "havuz-grid"
  | "hediye-yumusak"
  | "cekilis-katman";

export function odulYerlesimModu(sablon: DenemeSablonu, odulModeli: OdulModeli): OdulYerlesimModu {
  if (odulModeli === "ilkX") {
    return sablon === "cta-odakli" || sablon === "grid-odul" ? "havuz-grid" : "havuz-vurgu";
  }
  if (odulModeli === "katilim") return "hediye-yumusak";
  if (odulModeli === "cekilis") return "cekilis-katman";

  switch (sablon) {
    case "premium-spotlight":
      return "podium";
    case "grid-odul":
      return "grid-siki";
    case "gorsel-odakli":
    case "enerjik-genclik":
      return "story-buyuk";
    case "liste-odakli":
    case "cta-odakli":
      return "havuz-vurgu";
    case "hero-odul":
      return "spot";
    default:
      return "varsayilan";
  }
}
