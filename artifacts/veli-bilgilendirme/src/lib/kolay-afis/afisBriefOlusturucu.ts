import type {
  AfisAlternatif,
  AfisBloklar,
  AfisBrief,
  AlternatifVaryant,
  KolayAfisForm,
} from "@/types/kolayAfis";
import { AILE_ADLARI } from "@/types/kolayAfis";
import { alternatifAciklama, varyantIcinAile } from "./afisAileSecici";
import { afisMetinUret } from "./afisMetinUretici";
import { temaSec } from "./afisTemaSistemi";

const VARYANTLAR: AlternatifVaryant[] = ["sade", "dengeli", "enerjik"];

const VARYANT_BASLIK: Record<AlternatifVaryant, string> = {
  sade: "Sade",
  dengeli: "Dengeli",
  enerjik: "Enerjik / Vurgulu",
};

function bloklarOlustur(form: KolayAfisForm, varyant: AlternatifVaryant): AfisBloklar {
  const qr = Boolean(form.qrLink.trim());
  const tel = Boolean(form.telefon.trim());
  const kisa = form.yogunluk === "kisa";

  const base: AfisBloklar = {
    kurum: Boolean(form.kurumAdi.trim()),
    baslik: true,
    altBaslik: Boolean(form.sinifYas.trim()) || form.hedefKitle !== "veliler",
    tarih: Boolean(form.tarih.trim()),
    sinifSerit: form.hedefKitle === "karma" || form.hedefKitle === "ilkokul",
    kisaAciklama: !kisa && varyant !== "sade",
    guven: form.yogunluk === "detayli" || form.vurgu === "guven_mesaji",
    ozellikler: form.programMaddeleri.length > 0 || form.vurgu === "program_icerigi",
    programAkisi: form.afisTuru === "hafta_sonu" || form.afisTuru === "yatili_alistirma",
    qr: qr && (form.vurgu === "qr_basvuru" || varyant !== "sade"),
    telefon: tel,
    slogan: varyant === "enerjik" || form.tarz === "enerjik",
    altBant: varyant !== "sade",
  };

  if (varyant === "sade") {
    return {
      ...base,
      kisaAciklama: false,
      guven: false,
      ozellikler: base.ozellikler && form.programMaddeleri.length > 0,
      programAkisi: false,
      slogan: false,
      altBant: Boolean(form.telefon.trim()),
    };
  }

  if (varyant === "enerjik") {
    return { ...base, kisaAciklama: true, slogan: true, altBant: true, qr: qr || form.vurgu === "qr_basvuru" };
  }

  return base;
}

export function briefOlustur(form: KolayAfisForm, varyant: AlternatifVaryant): AfisBrief {
  const aile = varyantIcinAile(form.afisTuru, form.tarz, form.vurgu, varyant);
  const metin = afisMetinUret(form);

  if (aile === "qr_registration") {
    metin.callToAction = metin.callToAction || "QR kodu okutarak başvurun.";
  }
  if (aile === "program_flow") {
    metin.featureItems = metin.featureItems.slice(0, 4);
  }
  if (aile === "classic_info") {
    metin.featureItems = metin.featureItems.slice(0, 4);
  }

  return {
    aile,
    varyant,
    tema: temaSec(form.tarz, form.afisTuru),
    metin,
    bloklar: bloklarOlustur(form, varyant),
    tarihBuyuk: form.vurgu === "tarih" || varyant === "enerjik",
    qrBuyuk: form.vurgu === "qr_basvuru" || aile === "qr_registration",
    ozellikIkonlu: aile === "hero_campaign" || aile === "icon_feature",
  };
}

export function ucAlternatifUret(form: KolayAfisForm): AfisAlternatif[] {
  return VARYANTLAR.map((varyant) => {
    const brief = briefOlustur(form, varyant);
    return {
      id: varyant,
      varyant,
      aile: brief.aile,
      baslik: `${VARYANT_BASLIK[varyant]} · ${AILE_ADLARI[brief.aile]}`,
      aciklama: alternatifAciklama(brief.aile, varyant),
      brief,
    };
  });
}
