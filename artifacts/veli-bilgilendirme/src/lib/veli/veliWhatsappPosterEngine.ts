import type { FormData, SablonTuru } from "@/types";
import { aciklamaolustur, baslikolustur } from "@/lib/dil";
import { SABLON_LISTESI } from "@/lib/sablonlar";

/** WhatsApp paylaşım görseli tuval boyutu (4:5). */
export const VELI_WA_POSTER_W = 1080;
export const VELI_WA_POSTER_H = 1350;
export const VELI_WA_SAFE_PAD = 64;

export type VeliWaKaliteMadde = { ok: boolean; metin: string };

export type VeliWaKaliteSonuc = {
  durum: "hazir" | "dikkat";
  maddeler: VeliWaKaliteMadde[];
  uyarilar: string[];
};

function truncateChars(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1).trim();
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.55 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export function veliWhatsappGorselBaslik(form: FormData): string {
  return truncateChars(baslikolustur(form), 78);
}

export function veliWhatsappGorselAciklama(form: FormData): string {
  const kisaForm: FormData = { ...form, metinUzunlugu: "kisa" };
  const metin = aciklamaolustur(kisaForm);
  return truncateChars(metin, 195);
}

export function veliWhatsappGorselKurum(form: FormData): string {
  return truncateChars(form.kurumAdi.trim() || "Kurum Adı", 52);
}

export function veliWhatsappGorselGorseller(form: FormData): string[] {
  return form.gorseller.slice(0, 2);
}

export function veliWhatsappEtiketler(form: FormData): string[] {
  const aktif = form.faaliyetler
    .slice(0, form.faaliyetSayisi)
    .filter((f) => f.tur || f.alan)
    .slice(0, 3)
    .map((f) => f.alan || f.tur || "")
    .filter(Boolean);
  return aktif;
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

export function veliWhatsappKaliteKontrol(form: FormData): VeliWaKaliteSonuc {
  const maddeler: VeliWaKaliteMadde[] = [];
  const uyarilar: string[] = [];

  const baslikUzun = baslikolustur(form).length > 42;
  const metinUzun = form.posterMetni.length > 280;
  const gorselFazla = form.gorseller.length > 2;
  const baslikVar = Boolean(baslikolustur(form).trim());

  maddeler.push({
    ok: baslikVar && !baslikUzun,
    metin: !baslikVar
      ? "Başlık eksik"
      : baslikUzun
        ? "Başlık WhatsApp için uzun — görselde kısaltılır"
        : "Başlık WhatsApp için uygun",
  });
  maddeler.push({
    ok: !metinUzun,
    metin: metinUzun
      ? "Açıklama uzun — görselde kısa özet gösterilir"
      : "Açıklama WhatsApp görseline sığar",
  });
  maddeler.push({
    ok: !gorselFazla,
    metin: gorselFazla
      ? `${form.gorseller.length} görsel var; WhatsApp görselinde en fazla 2 kullanılır`
      : "Görsel sayısı WhatsApp için uygun",
  });
  maddeler.push({
    ok: Boolean(form.kurumAdi.trim()),
    metin: form.kurumAdi.trim() ? "Kurum adı var" : "Kurum adı boş",
  });

  if (baslikUzun) uyarilar.push("Başlık kısaltılarak gösterilecek. Daha kısa başlık önerilir.");
  if (metinUzun) uyarilar.push("Tam metin WhatsApp Metni alanında; görselde kısa özet kullanılır.");
  if (gorselFazla) uyarilar.push("Fazla görseller WhatsApp görselinde gösterilmez.");
  if (!form.isim.trim()) uyarilar.push("Hoca adı boş; alt bilgi eksik kalabilir.");

  const durum = uyarilar.length > 0 ? "dikkat" : "hazir";
  return { durum, maddeler, uyarilar };
}
