import type { FormData, SablonTuru } from "@/types";
import { baslikAlternatifleri } from "@/lib/dil";
import { SABLON_GORSEL_LIMITLERI } from "@/lib/sablonlar";
import {
  veliPosterOverflowRisk,
  veliPosterUzunMetinUyarisi,
} from "@/lib/veli/veliPosterEngine";

export type KaliteDurum = "hazir" | "dikkat" | "eksik";

export type KaliteMadde = { ok: boolean; metin: string };

export type KaliteSonuc = {
  durum: KaliteDurum;
  maddeler: KaliteMadde[];
  uyarilar: string[];
  oneriler: string[];
  tasmaRiski: boolean;
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
  const tasmaRiski = veliPosterOverflowRisk(form);
  const uzunMetinUyarisi = veliPosterUzunMetinUyarisi(form);

  maddeler.push({ ok: kurumVar, metin: kurumVar ? "Kimlik: kurum adı dolu" : "Kimlik: kurum adı eksik" });
  maddeler.push({ ok: isimVar, metin: isimVar ? "Kimlik: ad soyad dolu" : "Kimlik: ad soyad eksik" });
  maddeler.push({ ok: turSecili, metin: turSecili ? "Çalışma: faaliyet türü seçildi" : "Çalışma: faaliyet türü eksik" });
  maddeler.push({ ok: alanVar, metin: alanVar ? "Çalışma: ders / alan dolu" : "Çalışma: ders / alan eksik" });
  maddeler.push({
    ok: !gorselYok,
    metin: gorselYok ? "Görsel: henüz yüklenmedi" : "Görsel: en az bir fotoğraf var",
  });
  maddeler.push({
    ok: !baslikUzun && !metinUzun && !tasmaRiski,
    metin:
      !baslikUzun && !metinUzun && !tasmaRiski
        ? "Metin: afiş alanına uygun"
        : "Metin: uzunluk / taşma riski var",
  });
  maddeler.push({
    ok: !gorselAsim && !tasmaRiski,
    metin: gorselAsim
      ? "Düzen: görsel sayısı limiti aşıyor"
      : tasmaRiski
        ? "Düzen: yoğun içerik — kısaltma önerilir"
        : "Düzen: taşma riski düşük",
  });

  if (!kurumVar) uyarilar.push("Kurum adı boş. Afişin üst kısmı eksik görünebilir.");
  if (!isimVar) uyarilar.push("Ad soyad boş. İmza bölümü eksik kalabilir.");
  if (!turSecili) uyarilar.push("Faaliyet türü seçilmedi. Başlık ve metin daha genel oluşur.");
  if (!alanVar) uyarilar.push("Ders / alan boş. Afiş metni daha genel oluşabilir.");
  if (baslikUzun) uyarilar.push("Başlık uzun görünüyor. Daha kısa yazarsanız afiş daha düzenli olur.");
  if (metinUzun) uyarilar.push("Poster metni uzun. Kısa metin afişte daha okunaklı olur.");
  if (uzunMetinUyarisi) uyarilar.push(uzunMetinUyarisi);
  if (gorselYok) uyarilar.push("Fotoğraf eklenmedi. Görselsiz şablonlar da kullanılabilir.");
  if (gorselAsim) uyarilar.push("Yüklenen fotoğraf sayısı şablon limitini aşıyor; fazlaları görünmez.");
  if (tasmaRiski) uyarilar.push("İçerik yoğun. Font küçültme ve satır sınırı uygulanır; metni kısaltmanız önerilir.");

  if (!baslikUzun && baslik.length > 0 && baslik.length <= 28) {
    oneriler.push("Başlık kısa olduğu için afiş daha dengeli görünecek.");
  }
  if (form.metinUzunlugu === "kisa") {
    oneriler.push("Kısa metin seçildi; afişte temiz bir görünüm beklenir.");
  }
  if (gorselYok && !tasmaRiski) {
    oneriler.push("Görselsiz kurumsal şablonlar sade bir görünüm sağlar.");
  }

  const eksikSayisi = [!kurumVar, !isimVar, !turSecili].filter(Boolean).length;
  const uyariSayisi = uyarilar.length;

  let durum: KaliteDurum = "hazir";
  if (eksikSayisi >= 2) durum = "eksik";
  else if (uyariSayisi > 0 || tasmaRiski) durum = "dikkat";

  return { durum, maddeler, uyarilar, oneriler, tasmaRiski };
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
