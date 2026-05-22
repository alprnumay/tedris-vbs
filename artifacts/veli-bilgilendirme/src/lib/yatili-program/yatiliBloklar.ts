import type {
  YatiliBlokAyarlari,
  YatiliBlokId,
  YatiliProgramFormData,
  YatiliVurguOdagi,
  YatiliYogunlukModu,
} from "@/types/yatiliProgram";
import { varsayilanBloklar } from "@/types/yatiliProgram";

export type BlokMeta = { id: YatiliBlokId; ad: string; kisa: string; grup: "ust" | "icerik" | "alt" };

export const BLOK_LISTESI: BlokMeta[] = [
  { id: "kurum", ad: "Kurum / yurt adı", kisa: "Üst kurumsal kimlik", grup: "ust" },
  { id: "baslik", ad: "Program başlığı", kisa: "Ana başlık", grup: "ust" },
  { id: "tarih", ad: "Tarih rozeti", kisa: "Program tarihi", grup: "ust" },
  { id: "sinifYas", ad: "Sınıf / yaş", kisa: "Hedef grup", grup: "ust" },
  { id: "gorsel", ad: "Görsel alanı", kisa: "Kapak veya destek", grup: "ust" },
  { id: "kisaAciklama", ad: "Kısa açıklama", kisa: "Davet metni", grup: "icerik" },
  { id: "guven", ad: "Güven metni", kisa: "Veliye güvence", grup: "icerik" },
  { id: "gunlukProgram", ad: "Günlük program", kisa: "Saatli akış", grup: "icerik" },
  { id: "maddeler", ad: "Program maddeleri", kisa: "Madde listesi", grup: "icerik" },
  { id: "veliNot", ad: "Veliye not", kisa: "Ek veli bilgisi", grup: "icerik" },
  { id: "slogan", ad: "Slogan", kisa: "Vurucu cümle", grup: "icerik" },
  { id: "kontenjan", ad: "Kontenjan", kisa: "Kontenjan bilgisi", grup: "alt" },
  { id: "iletisim", ad: "İletişim / başvuru", kisa: "Telefon ve CTA", grup: "alt" },
  { id: "qr", ad: "QR kod", kisa: "Başvuru QR", grup: "alt" },
];

const YOGUNLUK_BLOKLAR: Record<YatiliYogunlukModu, Partial<YatiliBlokAyarlari>> = {
  sade: {
    kurum: true,
    baslik: true,
    tarih: true,
    sinifYas: false,
    kontenjan: false,
    kisaAciklama: true,
    guven: false,
    gunlukProgram: false,
    maddeler: false,
    veliNot: false,
    slogan: true,
    iletisim: true,
    qr: false,
    gorsel: true,
  },
  dengeli: {
    kurum: true,
    baslik: true,
    tarih: true,
    sinifYas: true,
    kontenjan: true,
    kisaAciklama: true,
    guven: true,
    gunlukProgram: false,
    maddeler: true,
    veliNot: false,
    slogan: true,
    iletisim: true,
    qr: true,
    gorsel: true,
  },
  detayli: {
    kurum: true,
    baslik: true,
    tarih: true,
    sinifYas: true,
    kontenjan: true,
    kisaAciklama: true,
    guven: true,
    gunlukProgram: true,
    maddeler: true,
    veliNot: true,
    slogan: true,
    iletisim: true,
    qr: true,
    gorsel: true,
  },
  veli_odakli: {
    kurum: true,
    baslik: true,
    tarih: true,
    sinifYas: true,
    kontenjan: true,
    kisaAciklama: true,
    guven: true,
    gunlukProgram: false,
    maddeler: false,
    veliNot: true,
    slogan: false,
    iletisim: true,
    qr: true,
    gorsel: false,
  },
  gorsel_odakli: {
    kurum: true,
    baslik: true,
    tarih: true,
    sinifYas: false,
    kontenjan: false,
    kisaAciklama: true,
    guven: false,
    gunlukProgram: false,
    maddeler: false,
    veliNot: false,
    slogan: true,
    iletisim: true,
    qr: true,
    gorsel: true,
  },
};

export function yogunlukModuUygula(mod: YatiliYogunlukModu): YatiliBlokAyarlari {
  const base = varsayilanBloklar();
  const patch = YOGUNLUK_BLOKLAR[mod];
  return { ...base, ...patch };
}

export function vurguOdagiUygula(
  vurgu: YatiliVurguOdagi,
  bloklar: YatiliBlokAyarlari,
): YatiliBlokAyarlari {
  const next = { ...bloklar };
  switch (vurgu) {
    case "tarih":
      next.tarih = true;
      next.sinifYas = true;
      break;
    case "guven":
      next.guven = true;
      next.veliNot = true;
      break;
    case "gunluk_program":
      next.gunlukProgram = true;
      next.maddeler = true;
      break;
    case "gorsel":
      next.gorsel = true;
      break;
    case "basvuru":
      next.qr = true;
      next.iletisim = true;
      break;
    case "slogan":
      next.slogan = true;
      break;
  }
  return next;
}

/** Kullanıcı tercihi + boş alan kuralları */
export function efektifBloklar(form: YatiliProgramFormData): YatiliBlokAyarlari {
  const b = { ...varsayilanBloklar(), ...form.bloklar };
  const out = { ...b };

  if (!form.kurumAdi.trim()) out.kurum = false;
  if (!form.programTitle.trim()) out.baslik = false;
  if (!form.programTarihi.trim()) out.tarih = false;
  if (!form.sinifYasGrubu.trim()) out.sinifYas = false;
  if (!form.kontenjan.trim()) out.kontenjan = false;
  if (!form.shortIntro.trim()) out.kisaAciklama = false;
  if (!form.trustMessage.trim()) out.guven = false;
  if (!form.slogan.trim()) out.slogan = false;
  if (!form.parentNote.trim()) out.veliNot = false;
  if (!form.iletisim.trim() && !form.callToAction.trim()) out.iletisim = false;
  if (!form.qrLink.trim()) out.qr = false;
  if (form.gunlukProgram.length === 0 || !form.gunlukProgram.some((s) => s.etkinlik.trim())) {
    out.gunlukProgram = false;
  }
  if (form.activities.length === 0) out.maddeler = false;

  if (form.gorselModu === "gorselsiz") out.gorsel = false;
  else if (!b.gorsel) out.gorsel = false;
  else out.gorsel = true;

  return out;
}

export function aktifBlokSayisi(visible: YatiliBlokAyarlari): number {
  return Object.values(visible).filter(Boolean).length;
}
