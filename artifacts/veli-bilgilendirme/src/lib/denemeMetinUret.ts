import type { AfisAmaci, DenemeSinaviFormData, MetinTonu } from "@/types/denemeSinavi";
import { sinifBadgeMetni } from "@/types/denemeSinavi";
import { denemeTarihEtiketi } from "@/lib/denemeOrnekVeri";

function hedefKitle(d: DenemeSinaviFormData): string {
  const s = sinifBadgeMetni(d);
  if (!s || s === "Sınıf bilgisi" || s === "Çoklu sınıf") return "öğrencilerimiz";
  if (["LGS", "TYT", "AYT"].some((x) => s.includes(x))) return `${s} sınavına hazırlanan adaylarımız`;
  return `${s} kapsamındaki öğrencilerimiz`;
}

/** Afişte renkli rozet satırı (katılım türü). */
export function afisKatilimVurguMetni(d: DenemeSinaviFormData): string | null {
  switch (d.katilimTuru) {
    case "Ücretsiz":
      return "ÜCRETSİZ KATILIM";
    case "Ücretli":
      return "ÜCRETLİ KATILIM";
    case "Kontenjan sınırlı":
      return "KONTENJAN SINIRLI";
    case "Ön kayıt zorunlu":
      return "ÖN KAYIT ZORUNLU";
    default:
      return null;
  }
}

/** Rozet altı kısa hedef satırı (sınıf odaklı). */
export function afisKisaAciklamaSatir(d: DenemeSinaviFormData): string | null {
  const s = sinifBadgeMetni(d);
  if (!s || s === "Sınıf bilgisi" || s === "Çoklu sınıf") return null;
  return `${s} için`;
}

/** Ödül adları + kısa açıklamalar; otomatik duyuruya eklenir. */
export function odulMetinOzetleri(d: DenemeSinaviFormData): { adlar: string; aciklamalar: string } {
  const adlar = [
    ...d.oduller.map((o) => o.title.trim()).filter(Boolean),
    ...d.havuzOgeleri.map((h) => h.ad.trim()).filter(Boolean),
  ];
  const aciklamalar = d.oduller.map((o) => o.description?.trim()).filter((x): x is string => Boolean(x));
  return {
    adlar: adlar.length ? adlar.slice(0, 6).join(", ") + (adlar.length > 6 ? "…" : "") : "",
    aciklamalar: aciklamalar.length ? aciklamalar.slice(0, 3).join(" · ") : "",
  };
}

function katilimCumlesiKisa(tur: string): string {
  switch (tur) {
    case "Ücretsiz":
      return "Katılım ücretsiz.";
    case "Ücretli":
      return "Ücret bilgisi için arayın.";
    case "Kontenjan sınırlı":
      return "Kontenjan sınırlı — erken kayıt.";
    case "Ön kayıt zorunlu":
      return "Ön kayıt zorunlu.";
    default:
      return "";
  }
}

function tarihSaat(d: DenemeSinaviFormData): string {
  const par: string[] = [];
  if (d.tarih) par.push(denemeTarihEtiketi(d.tarih));
  if (d.saat) par.push(d.saat);
  return par.join(" · ");
}

function amacBasligi(amac: AfisAmaci): string {
  const m: Record<AfisAmaci, string> = {
    odullu_deneme: "Ödüllü deneme sınavı",
    ucretsiz_seviye: "Ücretsiz seviye tespit sınavı",
    turkiye_geneli: "Türkiye geneli sınav duyurusu",
    lgs_tyt_prova: "LGS / TYT prova sınavı",
    kayit_daveti: "Kayıt ve başvuru daveti",
    sonuc_duyurusu: "Sınav sonuç duyurusu",
  };
  return m[amac];
}

/** Paylaşım / yedek: tek paragraf, kısa (eski uzun metin yerine). */
export function olusturDuyuruMetni(d: DenemeSinaviFormData, ton: MetinTonu): string {
  const kurum = d.kurumAdi.trim() || "Kurumumuz";
  const hedef = hedefKitle(d);
  const baslik = d.baslik.trim() || amacBasligi(d.afisAmaci ?? "odullu_deneme");
  const kat = katilimCumlesiKisa(d.katilimTuru);
  const ts = tarihSaat(d);
  const { adlar, aciklamalar } = odulMetinOzetleri(d);
  const odulParca = [adlar && `Ödüller: ${adlar}`, aciklamalar && `Not: ${aciklamalar}`].filter(Boolean).join(" ");

  if (ton === "kisa") {
    return [kurum, `${hedef} — ${baslik}`, ts, kat, odulParca].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  }

  const amacKisa: Record<AfisAmaci, string> = {
    odullu_deneme: "Ödüllü deneme ile bilgiyi ölçüyoruz.",
    ucretsiz_seviye: "Seviye tespiti ücretsiz.",
    turkiye_geneli: "Türkiye geneli duyuru.",
    lgs_tyt_prova: "Prova formatına yakın sınav.",
    kayit_daveti: "Kayıt dönemi bilgilendirmesi.",
    sonuc_duyurusu: "Sonuç duyurusu.",
  };

  if (ton === "heyecanli") {
    return [kurum, `${baslik} — ${hedef} bekliyoruz.`, amacKisa[d.afisAmaci], ts, kat, odulParca].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  }

  return [kurum, `${baslik}. ${hedef} için duyuru.`, amacKisa[d.afisAmaci], ts, kat, odulParca].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}
