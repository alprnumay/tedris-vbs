import type { ComponentType, Ref } from "react";
import { FormData, SablonTuru } from "@/types";
import { PRO_SABLON_IDS, SABLON_GORSEL_LIMITLERI, YENI_LAYOUT_SABLON_IDS } from "@/lib/sablonlar";
import { VeliPosterArtboard } from "./VeliPosterArtboard";
import SablonAkademik from "@/components/sablonlar/SablonAkademik";
import SablonEtkinlik from "@/components/sablonlar/SablonEtkinlik";
import SablonBulten from "@/components/sablonlar/SablonBulten";
import SablonTemali from "@/components/sablonlar/SablonTemali";
import SablonPremiumMinimal from "@/components/sablonlar/SablonPremiumMinimal";
import SablonKartliBilgi from "@/components/sablonlar/SablonKartliBilgi";
import SablonKurumsalResmi from "@/components/sablonlar/SablonKurumsalResmi";
import SablonHikaye from "@/components/sablonlar/SablonHikaye";
import SablonFotografOdakli from "@/components/sablonlar/SablonFotografOdakli";
import SablonPro from "@/components/sablonlar/SablonPro";
import SablonKolajBulten from "@/components/sablonlar/SablonKolajBulten";
import SablonDergiSayfasi from "@/components/sablonlar/SablonDergiSayfasi";
import SablonGunlukAkis from "@/components/sablonlar/SablonGunlukAkis";
import SablonFotoAlbumu from "@/components/sablonlar/SablonFotoAlbumu";
import SablonTekGucluAfis from "@/components/sablonlar/SablonTekGucluAfis";
import SablonSinifRaporKarti from "@/components/sablonlar/SablonSinifRaporKarti";
import SablonDuyuruPanosu from "@/components/sablonlar/SablonDuyuruPanosu";
import SablonMiniBrosur from "@/components/sablonlar/SablonMiniBrosur";
import SablonYanSeritKurumsal from "@/components/sablonlar/SablonYanSeritKurumsal";
import SablonCokluFaaliyetRaporu from "@/components/sablonlar/SablonCokluFaaliyetRaporu";
import { TemplateQualityGate } from "@/lib/sablonlar/templateLayoutEngine";

const TEMALI: SablonTuru[] = ["lacivert", "mor", "kirmizi", "turuncu", "pembe", "teal", "altin"];

const YENI_LAYOUT_MAP: Partial<Record<SablonTuru, ComponentType<{ form: FormData; tarih: string }>>> = {
  "kolaj-bulten": SablonKolajBulten,
  "dergi-sayfasi": SablonDergiSayfasi,
  "gunluk-akis": SablonGunlukAkis,
  "foto-albumu": SablonFotoAlbumu,
  "tek-guclu-afis": SablonTekGucluAfis,
  "sinif-rapor-karti": SablonSinifRaporKarti,
  "duyuru-panosu": SablonDuyuruPanosu,
  "mini-brosur": SablonMiniBrosur,
  "yan-serit-kurumsal": SablonYanSeritKurumsal,
  "coklu-faaliyet-raporu": SablonCokluFaaliyetRaporu,
};

function bugunTarih(): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  try {
    return new Date().toLocaleDateString("tr-TR", opts);
  } catch {
    return new Date().toDateString();
  }
}

function sablonIcerik(form: FormData, sablon: SablonTuru, tarih: string) {
  const YeniLayout = YENI_LAYOUT_MAP[sablon];
  if (YeniLayout) return <YeniLayout form={form} tarih={tarih} />;

  if (sablon === "akademik") return <SablonAkademik form={form} tarih={tarih} />;
  if (sablon === "etkinlik") return <SablonEtkinlik form={form} tarih={tarih} />;
  if (sablon === "bulten") return <SablonBulten form={form} tarih={tarih} />;
  if (sablon === "premium-minimal") return <SablonPremiumMinimal form={form} tarih={tarih} />;
  if (sablon === "kartli-bilgi") return <SablonKartliBilgi form={form} tarih={tarih} />;
  if (sablon === "kurumsal-resmi") return <SablonKurumsalResmi form={form} tarih={tarih} />;
  if (sablon === "hikaye") return <SablonHikaye form={form} tarih={tarih} />;
  if (sablon === "fotograf-odakli") return <SablonFotografOdakli form={form} tarih={tarih} />;
  if ((PRO_SABLON_IDS as string[]).includes(sablon)) return <SablonPro form={form} tarih={tarih} sablonId={sablon} />;
  if (TEMALI.includes(sablon)) return <SablonTemali form={form} tarih={tarih} sablonId={sablon} />;
  return <SablonAkademik form={form} tarih={tarih} />;
}

export function VeliOnizlemeIcerik({
  form,
  sablon,
  artboardRef,
}: {
  form: FormData;
  sablon: SablonTuru;
  artboardRef?: Ref<HTMLDivElement>;
}) {
  const tarih = bugunTarih();
  const limit = SABLON_GORSEL_LIMITLERI[sablon] ?? 4;
  const f = { ...form, gorseller: form.gorseller.slice(0, limit) };

  return (
    <VeliPosterArtboard artboardRef={artboardRef}>
      <TemplateQualityGate>{sablonIcerik(f, sablon, tarih)}</TemplateQualityGate>
    </VeliPosterArtboard>
  );
}

export { YENI_LAYOUT_SABLON_IDS };
