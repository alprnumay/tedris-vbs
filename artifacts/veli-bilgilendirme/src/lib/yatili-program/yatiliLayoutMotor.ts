import type { YatiliBlokAyarlari, YatiliProgramFormData } from "@/types/yatiliProgram";
import { aktifBlokSayisi, efektifBloklar } from "./yatiliBloklar";
import { arkaPlanStil } from "./yatiliArkaPlanlar";
import { yatiliTemaAl } from "./yatiliTema";

export type YatiliLayoutPlan = {
  visible: YatiliBlokAyarlari;
  aktifBlokSayisi: number;
  dark: boolean;
  arkaPlanZemin: string;
  arkaPlanDekor?: string;
  /** flex-grow boşluk dağılımı */
  spacerUst: number;
  spacerOrta: number;
  spacerAlt: number;
  kapakYukseklik: number;
  destekMaxH: number;
  qrTamGenislik: boolean;
  maddelerGenis: boolean;
  gunlukMerkez: boolean;
  baslikBuyuk: boolean;
  tarihHero: boolean;
  sloganBuyuk: boolean;
  guvenBuyuk: boolean;
  aciklamaGenis: boolean;
  guvenGenis: boolean;
  dekoratifBanner: boolean;
  sectionGap: number;
};

export function yatiliLayoutHesapla(form: YatiliProgramFormData): YatiliLayoutPlan {
  const visible = efektifBloklar(form);
  const tema = yatiliTemaAl(form.renkTema);
  const dark = form.sablon === "night_theme" || form.arkaPlanId === "gece_doku" || form.arkaPlanId === "premium_gorselsiz";
  const bg = arkaPlanStil(form.arkaPlanId, tema, dark);

  const gorselKapali = !visible.gorsel || form.gorselModu === "gorselsiz";
  const gunlukKapali = !visible.gunlukProgram;
  const sloganKapali = !visible.slogan;
  const qrKapali = !visible.qr;
  const guvenKapali = !visible.guven;
  const veliKapali = !visible.veliNot;
  const maddelerKapali = !visible.maddeler;

  const ustBlokSayisi = [visible.kurum, visible.baslik, visible.tarih, visible.sinifYas].filter(Boolean).length;
  const icerikBlokSayisi = [
    visible.kisaAciklama,
    visible.guven,
    visible.gunlukProgram,
    visible.maddeler,
    visible.veliNot,
    visible.slogan,
  ].filter(Boolean).length;

  let spacerOrta = 0;
  if (gorselKapali && gunlukKapali) spacerOrta = 1.4;
  else if (gorselKapali) spacerOrta = 0.8;
  else if (gunlukKapali && icerikBlokSayisi <= 2) spacerOrta = 1;

  if (sloganKapali) spacerOrta += 0.25;
  if (guvenKapali && visible.kisaAciklama) spacerOrta += 0.15;
  if (veliKapali && visible.guven) spacerOrta += 0.2;
  if (maddelerKapali && visible.guven) spacerOrta += 0.35;
  if (maddelerKapali && visible.kisaAciklama && !visible.guven) spacerOrta += 0.3;
  if (maddelerKapali && gunlukKapali && visible.kisaAciklama) spacerOrta += 0.15;

  const kapakYukseklik = gorselKapali
    ? 0
    : form.gorselModu === "buyuk_kapak"
      ? gunlukKapali
        ? 230
        : 175
      : 0;

  const destekMaxH = gorselKapali ? 0 : form.gorselModu === "kucuk_destek" ? (gunlukKapali ? 100 : 72) : 0;

  return {
    visible,
    aktifBlokSayisi: aktifBlokSayisi(visible),
    dark,
    arkaPlanZemin: bg.zemin,
    arkaPlanDekor: bg.dekor,
    spacerUst: gorselKapali && ustBlokSayisi <= 2 ? 0.6 : 0,
    spacerOrta,
    spacerAlt: 0,
    kapakYukseklik,
    destekMaxH,
    qrTamGenislik: qrKapali || !visible.qr,
    maddelerGenis: gunlukKapali && visible.maddeler,
    gunlukMerkez: visible.gunlukProgram && form.sablon === "program_flow",
    baslikBuyuk: gorselKapali || form.vurguOdagi === "slogan",
    tarihHero: visible.tarih && (form.vurguOdagi === "tarih" || form.sablon === "night_theme"),
    sloganBuyuk: visible.slogan && (form.vurguOdagi === "slogan" || form.sablon === "night_theme"),
    guvenBuyuk: visible.guven && (form.vurguOdagi === "guven" || form.sablon === "trust_focused" || maddelerKapali),
    aciklamaGenis: maddelerKapali && visible.kisaAciklama && !visible.gunlukProgram,
    guvenGenis: maddelerKapali && visible.guven,
    dekoratifBanner: gorselKapali,
    sectionGap: sloganKapali ? 6 : 12,
  };
}

export function vurguSablonOnerisi(vurgu: YatiliProgramFormData["vurguOdagi"]): YatiliProgramFormData["sablon"] {
  switch (vurgu) {
    case "gorsel":
      return "hero_invite";
    case "gunluk_program":
      return "program_flow";
    case "guven":
      return "trust_focused";
    case "slogan":
      return "night_theme";
    case "tarih":
      return "hero_invite";
    case "basvuru":
      return "trust_focused";
    default:
      return "hero_invite";
  }
}
