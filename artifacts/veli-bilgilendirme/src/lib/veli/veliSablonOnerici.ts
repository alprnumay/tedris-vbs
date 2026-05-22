import type { FormData, SablonTuru } from "@/types";
import { SABLON_LISTESI } from "@/lib/sablonlar";

export function onerilenSablon(form: FormData, secili: SablonTuru): { id: SablonTuru; ad: string; neden: string } | null {
  const gorselSayisi = form.gorseller.length;
  const faaliyet = form.faaliyetler[0];
  const tur = faaliyet?.tur ?? "";

  if (gorselSayisi === 0) {
    const aday = SABLON_LISTESI.find((s) => s.id === "premium-minimal" || s.id === "kurumsal-resmi" || s.id === "akademik");
    if (aday && aday.id !== secili) return { id: aday.id, ad: aday.ad, neden: "Fotoğraf yok; görselsiz kurumsal şablon daha dengeli görünür." };
  }

  if (gorselSayisi >= 2 && secili !== "fotograf-odakli") {
    const aday = SABLON_LISTESI.find((s) => s.id === "fotograf-odakli");
    if (aday) return { id: aday.id, ad: aday.ad, neden: "Birden fazla fotoğraf için fotoğraf odaklı şablon uygun." };
  }

  if (tur === "Etüt" || tur === "Ders") {
    const aday = SABLON_LISTESI.find((s) => s.id === "kartli-bilgi");
    if (aday && aday.id !== secili) return { id: aday.id, ad: aday.ad, neden: "Ders / etüt çalışmalarını net göstermek için kartlı düzen önerilir." };
  }

  if (form.metinUzunlugu === "detayli" && secili === "fotograf-odakli") {
    const aday = SABLON_LISTESI.find((s) => s.id === "premium-minimal");
    if (aday) return { id: aday.id, ad: aday.ad, neden: "Uzun metin için sade şablon daha okunaklı olur." };
  }

  return null;
}
