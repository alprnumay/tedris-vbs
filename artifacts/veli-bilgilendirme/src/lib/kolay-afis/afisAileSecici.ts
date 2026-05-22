import type {
  AfisAilesi,
  AfisTarzi,
  AfisTuru,
  AlternatifVaryant,
  BilgiYogunlugu,
  VurguOdagi,
} from "@/types/kolayAfis";

const TUR_AILELER: Record<AfisTuru, AfisAilesi[]> = {
  yaz_kampi: ["hero_campaign", "icon_feature", "qr_registration"],
  yatili_alistirma: ["trust_program", "program_flow", "classic_info"],
  hafta_sonu: ["program_flow", "trust_program", "classic_info"],
  kayit_on_kayit: ["qr_registration", "hero_campaign", "classic_info"],
  egitim_programi: ["icon_feature", "classic_info", "hero_campaign"],
  etkinlik_gezi: ["program_flow", "hero_campaign", "classic_info"],
  deneme_sinavi: ["qr_registration", "classic_info", "hero_campaign"],
  veli_toplantisi: ["classic_info", "trust_program", "program_flow"],
  brosur_tanitim: ["icon_feature", "classic_info", "hero_campaign"],
  diger: ["classic_info", "icon_feature", "hero_campaign"],
};

export function turIcinAileler(tur: AfisTuru): AfisAilesi[] {
  return [...TUR_AILELER[tur]];
}

export function varyantIcinAile(
  tur: AfisTuru,
  tarz: AfisTarzi,
  vurgu: VurguOdagi,
  varyant: AlternatifVaryant,
): AfisAilesi {
  const havuz = turIcinAileler(tur);

  if (vurgu === "qr_basvuru") {
    if (varyant === "sade") return "qr_registration";
    if (varyant === "enerjik") return "qr_registration";
    return havuz.includes("qr_registration") ? "qr_registration" : havuz[0];
  }

  if (vurgu === "program_icerigi") {
    if (varyant === "enerjik") return havuz.includes("hero_campaign") ? "hero_campaign" : "icon_feature";
    if (varyant === "dengeli") return havuz.includes("icon_feature") ? "icon_feature" : havuz[0];
    return "classic_info";
  }

  if (vurgu === "guven_mesaji") {
    if (varyant === "sade") return "classic_info";
    return havuz.includes("trust_program") ? "trust_program" : havuz[0];
  }

  if (tarz === "enerjik" || tarz === "cocuk_dostu") {
    if (varyant === "enerjik") return havuz.includes("hero_campaign") ? "hero_campaign" : "icon_feature";
    if (varyant === "dengeli") return havuz[1] ?? havuz[0];
    return "classic_info";
  }

  if (tarz === "kurumsal" || tarz === "klasik") {
    if (varyant === "sade") return "classic_info";
    if (varyant === "dengeli") return havuz.includes("trust_program") ? "trust_program" : "classic_info";
    return havuz.includes("program_flow") ? "program_flow" : havuz[0];
  }

  const sira: Record<AlternatifVaryant, number> = { sade: 2, dengeli: 0, enerjik: 1 };
  const idx = Math.min(sira[varyant], havuz.length - 1);
  return havuz[idx];
}

export function alternatifAciklama(aile: AfisAilesi, varyant: AlternatifVaryant): string {
  const neden: Record<AfisAilesi, string> = {
    hero_campaign: "Büyük başlık ve kampanya enerjisi",
    trust_program: "Veli güveni ve program açıklaması",
    program_flow: "Saatli program akışı",
    icon_feature: "İkonlu program maddeleri",
    qr_registration: "QR ve hızlı başvuru",
    classic_info: "Sade kurumsal düzen",
  };
  const ton: Record<AlternatifVaryant, string> = {
    sade: "Az metin, temiz görünüm",
    dengeli: "Genel kullanım için dengeli",
    enerjik: "Başlık ve vurgu daha baskın",
  };
  return `${neden[aile]} · ${ton[varyant]}`;
}
