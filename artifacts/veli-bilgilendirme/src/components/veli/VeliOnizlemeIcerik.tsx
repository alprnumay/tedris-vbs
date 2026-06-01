import { FormData, SablonTuru } from "@/types";
import { PRO_SABLON_IDS, SABLON_GORSEL_LIMITLERI } from "@/lib/sablonlar";
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

const TEMALI: SablonTuru[] = ["lacivert", "mor", "kirmizi", "turuncu", "pembe", "teal", "altin"];

function bugunTarih(): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  try {
    return new Date().toLocaleDateString("tr-TR", opts);
  } catch {
    return new Date().toDateString();
  }
}

export function VeliOnizlemeIcerik({ form, sablon }: { form: FormData; sablon: SablonTuru }) {
  const tarih = bugunTarih();
  const limit = SABLON_GORSEL_LIMITLERI[sablon] ?? 4;
  const f = { ...form, gorseller: form.gorseller.slice(0, limit) };

  if (sablon === "akademik") return <SablonAkademik form={f} tarih={tarih} />;
  if (sablon === "etkinlik") return <SablonEtkinlik form={f} tarih={tarih} />;
  if (sablon === "bulten") return <SablonBulten form={f} tarih={tarih} />;
  if (sablon === "premium-minimal") return <SablonPremiumMinimal form={f} tarih={tarih} />;
  if (sablon === "kartli-bilgi") return <SablonKartliBilgi form={f} tarih={tarih} />;
  if (sablon === "kurumsal-resmi") return <SablonKurumsalResmi form={f} tarih={tarih} />;
  if (sablon === "hikaye") return <SablonHikaye form={f} tarih={tarih} />;
  if (sablon === "fotograf-odakli") return <SablonFotografOdakli form={f} tarih={tarih} />;
  if ((PRO_SABLON_IDS as string[]).includes(sablon)) return <SablonPro form={f} tarih={tarih} sablonId={sablon} />;
  if (TEMALI.includes(sablon)) return <SablonTemali form={f} tarih={tarih} sablonId={sablon} />;
  return <SablonAkademik form={f} tarih={tarih} />;
}
