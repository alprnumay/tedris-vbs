import type { FormData, SablonTuru } from "@/types";
import { aciklamaolustur, baslikolustur } from "@/lib/dil";
import { SABLON_LISTESI } from "@/lib/sablonlar";

/** WhatsApp paylaşım görseli tuval boyutu (4:5). */
export const VELI_WA_POSTER_W = 1080;
export const VELI_WA_POSTER_H = 1350;
export const VELI_WA_SAFE_PAD = 64;

function truncateChars(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1).trim();
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.55 ? cut.slice(0, lastSpace) : cut).trim()}...`;
}

export function veliWhatsappGorselBaslik(form: FormData): string {
  return truncateChars(baslikolustur(form), 78);
}

export function veliWhatsappGorselAciklama(form: FormData): string {
  const kisaForm: FormData = { ...form, metinUzunlugu: "kisa" };
  return truncateChars(aciklamaolustur(kisaForm), 195);
}

export function veliWhatsappGorselKurum(form: FormData): string {
  return truncateChars(form.kurumAdi.trim() || "Kurum Adı", 52);
}

export function veliWhatsappGorselGorseller(form: FormData): string[] {
  return form.gorseller.slice(0, 2);
}

export function veliWhatsappEtiketler(form: FormData): string[] {
  return form.faaliyetler
    .slice(0, form.faaliyetSayisi)
    .filter((f) => f.tur || f.alan)
    .slice(0, 3)
    .map((f) => f.alan || f.tur || "")
    .filter(Boolean);
}

export function veliWhatsappSablonRenk(sablon: SablonTuru): { accent: string; bg: string; text: string } {
  const meta = SABLON_LISTESI.find((s) => s.id === sablon);
  const accent = meta?.chipRenk ?? "#2563eb";
  if (sablon === "fotograf-odakli") {
    return { accent: "#38bdf8", bg: "#0f172a", text: "#f8fafc" };
  }
  return {
    accent,
    bg: `linear-gradient(165deg, ${accent} 0%, #0f172a 72%)`,
    text: "#ffffff",
  };
}
