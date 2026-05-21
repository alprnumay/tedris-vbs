import type {
  LogoConfigV1,
  LogoGrupEtiketi,
  LogoSihirbazForm,
  LogoBorderId,
  LogoFontPairId,
  LogoIconId,
  LogoLayoutId,
  LogoOrnamentId,
  LogoShapeId,
} from "@/types/logoKimlik";
import { paletAl } from "./logoRenkTemalari";
import { logoFingerprintOlustur } from "./logoFingerprint";

const SHAPES: LogoShapeId[] = ["daire_arma", "kalkan", "rozet", "minimal_yuvarlak"];
const ICONS: LogoIconId[] = ["kitap", "mesale", "yildiz", "defne", "kalem"];
const LAYOUTS: LogoLayoutId[] = ["merkez_ust_ad", "merkez_alt_slogan", "rozet_cevre", "monogram_merkez"];
const FONTS: LogoFontPairId[] = ["klasik_serif", "modern_sans", "guclu_kurumsal", "sade_minimal"];
const BORDERS: LogoBorderId[] = ["ince", "kalin", "cift", "yok"];
const ORNAMENTS: LogoOrnamentId[] = ["none", "ust_cizgi", "alt_cizgi", "kose_nokta"];
const GRUPLAR: LogoGrupEtiketi[] = ["en_kurumsal", "daha_modern", "daha_sade", "daha_ayirt_edici"];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedSayi(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(rng: () => number, arr: T[], index: number): T {
  return arr[Math.floor(rng() * arr.length + index * 0.13) % arr.length];
}

function layoutForCategory(
  kategori: LogoSihirbazForm["kategori"],
  yon: LogoSihirbazForm["gorselYon"],
  layout: LogoLayoutId,
): LogoLayoutId {
  if (kategori === "monogram" || yon === "monogram") return "monogram_merkez";
  if (yon === "wordmark") return "merkez_ust_ad";
  if (yon === "symbol") return layout === "monogram_merkez" ? "merkez_ust_ad" : layout;
  return layout;
}

function iconForYon(yon: LogoSihirbazForm["gorselYon"], icon: LogoIconId): LogoIconId {
  if (yon === "wordmark") return "yildiz";
  if (yon === "monogram") return "yildiz";
  return icon;
}

export function logoOnerileriUret(form: LogoSihirbazForm, motorSeed: string): LogoConfigV1[] {
  if (!form.kategori) return [];

  const rng = mulberry32(seedSayi(motorSeed));
  const seen = new Set<string>();
  const out: LogoConfigV1[] = [];
  let guard = 0;

  while (out.length < 12 && guard < 80) {
    guard++;
    const shapeId = pick(rng, SHAPES, out.length);
    const iconId = iconForYon(form.gorselYon, pick(rng, ICONS, out.length + 1));
    const layoutId = layoutForCategory(form.kategori, form.gorselYon, pick(rng, LAYOUTS, out.length + 2));
    const fontPairId = pick(rng, FONTS, out.length + 3);
    const borderId = pick(rng, BORDERS, out.length + 4);
    const ornamentId = pick(rng, ORNAMENTS, out.length + 5);

    const variant = { shapeId, borderId, iconId, layoutId, fontPairId, ornamentId };
    const draft: LogoConfigV1 = {
      version: 1,
      category: form.kategori,
      organization: { ...form.kurum },
      traits: [...form.karakterler],
      visualDirection: form.gorselYon,
      colorTheme: form.renkTema,
      variant,
      display: {
        showTagline: Boolean(form.kurum.slogan.trim()),
        showYear: Boolean(form.kurum.kurulusYili.trim()),
        showCity: Boolean(form.kurum.sehir.trim()),
        titleScale: 0.92 + rng() * 0.16,
      },
      palette: paletAl(form.renkTema),
      seed: `${motorSeed}-${out.length}`,
      groupLabel: GRUPLAR[out.length % 4],
      fingerprint: "",
    };
    draft.fingerprint = logoFingerprintOlustur(draft);
    if (seen.has(draft.fingerprint)) continue;
    seen.add(draft.fingerprint);
    out.push(draft);
  }

  return out;
}

export function yeniMotorSeed(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
