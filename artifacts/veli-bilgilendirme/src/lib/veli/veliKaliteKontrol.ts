import type { FormData, SablonTuru } from "@/types";
import { baslikAlternatifleri } from "@/lib/dil";
import { SABLON_GORSEL_LIMITLERI } from "@/lib/sablonlar";

export type KaliteDurum = "hazir" | "dikkat" | "eksik";

export type KaliteMadde = { ok: boolean; metin: string };

export type KaliteSonuc = {
  durum: KaliteDurum;
  maddeler: KaliteMadde[];
  uyarilar: string[];
  oneriler: string[];
};

export function veliKaliteKontrol(form: FormData, seciliSablon: SablonTuru): KaliteSonuc {
  const maddeler: KaliteMadde[] = [];
  const uyarilar: string[] = [];
  const oneriler: string[] = [];

  const kurumVar = Boolean(form.kurumAdi.trim());
  const isimVar = Boolean(form.isim.trim());
  const faaliyet = form.faaliyetler[0];
  const turSecili = Boolean(faaliyet?.tur?.trim());
  const alanVar = Boolean(faaliyet?.alan?.trim());
  const baslik = baslikAlternatifleri(form)[form.seciliBaslikIdx ?? 0] ?? "";
  const baslikUzun = baslik.length > 42;
  const metinUzun = form.posterMetni.length > 520;
  const gorselYok = form.gorseller.length === 0;
  const gorselAsim = form.gorseller.length > (SABLON_GORSEL_LIMITLERI[seciliSablon] ?? 4);

  maddeler.push({ ok: kurumVar, metin: kurumVar ? "Kurum adı var" : "Kurum adı boş" });
  maddeler.push({ ok: isimVar, metin: isimVar ? "Hoca / mesul adı var" : "Ad soyad boş" });
  maddeler.push({ ok: turSecili, metin: turSecili ? "Faaliyet türü seçildi" : "Faaliyet türü seçilmedi" });
  maddeler.push({ ok: alanVar, metin: alanVar ? "Ders / alan dolu" : "Ders / alan boş" });
  maddeler.push({
    ok: !baslikUzun && !metinUzun,
    metin: !baslikUzun && !metinUzun ? "Metin uzunluğu uygun" : "Metin uzunluğu kontrol edilmeli",
  });
  maddeler.push({
    ok: !gorselAsim,
    metin: gorselYok ? "Görsel yok (görselsiz düzen)" : gorselAsim ? "Görsel sayısı fazla" : "Görsel düzeni uygun",
  });

  if (!kurumVar) uyarilar.push("Kurum adı boş. Afişin üst kısmı eksik görünebilir.");
  if (!isimVar) uyarilar.push("Ad soyad boş. İmza bölümü eksik kalabilir.");
  if (!turSecili) uyarilar.push("Faaliyet türü seçilmedi. Başlık ve metin daha genel oluşur.");
  if (!alanVar) uyarilar.push("Ders / alan boş. Afiş metni daha genel oluşabilir.");
  if (baslikUzun) uyarilar.push("Başlık uzun görünüyor. Daha kısa yazarsanız afiş daha düzenli olur.");
  if (metinUzun) uyarilar.push("Poster metni uzun. Kısa metin afişte daha okunaklı olur.");
  if (gorselYok) uyarilar.push("Fotoğraf eklenmedi. Görselsiz şablonlar daha uygun olabilir.");
  if (gorselAsim) uyarilar.push("Yüklenen fotoğraf sayısı şablon limitini aşıyor; fazlaları görünmez.");

  if (!baslikUzun && baslik.length > 0 && baslik.length <= 28) {
    oneriler.push("Başlık kısa olduğu için afiş daha dengeli görünecek.");
  }
  if (form.metinUzunlugu === "kisa") {
    oneriler.push("Kısa metin seçildi; afişte temiz bir görünüm beklenir.");
  }

  const eksikSayisi = [!kurumVar, !isimVar, !turSecili].filter(Boolean).length;
  const uyariSayisi = uyarilar.length;

  let durum: KaliteDurum = "hazir";
  if (eksikSayisi >= 2) durum = "eksik";
  else if (uyariSayisi > 0) durum = "dikkat";

  return { durum, maddeler, uyarilar, oneriler };
}

export function veliSistemOnerileri(form: FormData, seciliSablon: SablonTuru): string[] {
  const kalite = veliKaliteKontrol(form, seciliSablon);
  const liste = [...kalite.oneriler, ...kalite.uyarilar.slice(0, 3)];

  if (form.gorseller.length === 0) {
    liste.push("Fotoğraf eklemezseniz görselsiz kurumsal şablon daha uygun olur.");
  }
  if (form.posterMetni.length > 400) {
    liste.push("Metin uzun. Kısa metin modunu deneyebilirsiniz.");
  }

  return [...new Set(liste)].slice(0, 5);
}
