import type { AfisMetin, AfisTuru, BilgiYogunlugu, HedefKitle, KolayAfisForm } from "@/types/kolayAfis";
import { kisalt, LIMIT, normalizeAfisMetin } from "./afisAlanKurallari";

const HEDEF_ALT: Record<HedefKitle, string> = {
  ilkokul: "İlkokul Talebelerine Özel",
  ortaokul: "Ortaokul Talebelerine Özel",
  lise: "Lise Talebelerine Özel",
  veliler: "Velilerimize Özel Duyuru",
  karma: "İlkokul ve Ortaokul Talebelerine Özel",
};

const TUR_METIN: Record<
  AfisTuru,
  { title: string; intro: string; trust: string; slogan: string; cta: string; footer: string; items: string[] }
> = {
  yaz_kampi: {
    title: "Yaz Kampı Başlıyor",
    intro: "Bu yaz; eğitim, gelişim ve sosyal etkinliklerle dolu verimli bir program sizleri bekliyor.",
    trust: "Talebelerimiz güvenli ve düzenli bir ortamda takip edilecektir.",
    slogan: "Güvenli ortam • Düzenli program • Verimli yaz dönemi",
    cta: "Erken kayıt için QR kodu okutarak hemen başvuru yapabilirsiniz.",
    footer: "Kayıt ve bilgi için iletişime geçiniz.",
    items: ["Kur'an-ı Kerim", "Temel Dini Bilgiler", "Ders Destek ve Etüt", "Kişisel Gelişim", "Etkinlik ve İkram"],
  },
  yatili_alistirma: {
    title: "Yatılı Alıştırma Programı",
    intro: "Talebelerimizin yurt ortamına ısınmaları ve yatılı düzene alışmaları için özel bir program hazırlanmıştır.",
    trust: "Program boyunca talebelerimiz hocalarımız eşliğinde güvenli ve sıcak bir ortamda takip edilecektir.",
    slogan: "Yurda alışmanın en güzel başlangıcı",
    cta: "Kayıt ve detaylı bilgi için yurt mesulüyle iletişime geçiniz.",
    footer: "Sınırlı kontenjan — Erken kayıt avantajı",
    items: ["Tanışma ve kaynaşma", "Yurt düzeni", "Akşam programı", "Veli bilgilendirme"],
  },
  hafta_sonu: {
    title: "Hafta Sonu Yatılı Programı",
    intro: "Hafta sonu boyunca yurt deneyimi ve programlı bir alıştırma sunuyoruz.",
    trust: "Deneyimli kadromuz eşliğinde güvenli bir hafta sonu geçireceksiniz.",
    slogan: "Hafta sonunu verimli geçirin",
    cta: "Kayıt için QR kodu okutun veya arayın.",
    footer: "Kontenjan sınırlıdır.",
    items: ["Cuma akşamı karşılama", "Cumartesi program", "Pazar değerlendirme"],
  },
  kayit_on_kayit: {
    title: "Ön Kayıt Başladı",
    intro: "Erken kayıt yaptıran ailelerimize öncelik tanınacaktır.",
    trust: "Kurumsal ve şeffaf kayıt süreci.",
    slogan: "Yerinizi şimdiden ayırtın",
    cta: "QR kodu okutarak ön kayıt formunu doldurun.",
    footer: "Sorularınız için bizi arayın.",
    items: ["Hızlı başvuru", "Öncelikli yer", "Bilgilendirme"],
  },
  egitim_programi: {
    title: "Eğitim Programı",
    intro: "Ders destek, etüt ve kişisel gelişim içeren kapsamlı bir program.",
    trust: "Uzman eğitmen kadrosu ile düzenli takip.",
    slogan: "Öğrenmeye güçlü bir başlangıç",
    cta: "Program detayı ve kayıt için iletişime geçin.",
    footer: "Bilgi almak için arayın.",
    items: ["Ders destek", "Etüt", "Kişisel gelişim", "Değerler eğitimi"],
  },
  etkinlik_gezi: {
    title: "Etkinlik Duyurusu",
    intro: "Öğrencilerimiz için özel etkinlik ve gezi programı.",
    trust: "Güvenli ulaşım ve rehberlik sağlanacaktır.",
    slogan: "Birlikte güzel anılar",
    cta: "Katılım için kayıt yaptırın.",
    footer: "Son kayıt tarihine dikkat ediniz.",
    items: ["Etkinlik tanıtımı", "Tarih ve yer", "Katılım koşulları"],
  },
  deneme_sinavi: {
    title: "Deneme Sınavı",
    intro: "Seviye belirleme ve hazırlık için deneme sınavı düzenlenecektir.",
    trust: "Sonuçlar velilerle paylaşılacaktır.",
    slogan: "Hedefinize bir adım daha yakın",
    cta: "Başvuru için QR kodu kullanın.",
    footer: "Sınav yeri ve saati afişte belirtilmiştir.",
    items: ["Sınav tarihi", "Başvuru", "Sonuç bilgilendirme"],
  },
  veli_toplantisi: {
    title: "Veli Toplantısı",
    intro: "Velilerimizi bilgilendirmek için toplantı düzenlenecektir.",
    trust: "Kurumsal ve açık iletişim.",
    slogan: "Birlikte daha güçlüyüz",
    cta: "Katılım için lütfen bilgi veriniz.",
    footer: "Tarih ve saat önemlidir.",
    items: ["Gündem", "Soru-cevap", "Bilgilendirme"],
  },
  brosur_tanitim: {
    title: "Kurum Tanıtımı",
    intro: "Eğitim anlayışımız ve imkânlarımız hakkında kısa bilgi.",
    trust: "Güvenilir ve köklü kurum.",
    slogan: "Geleceğe birlikte yürüyoruz",
    cta: "Detaylı bilgi için bizi arayın.",
    footer: "Ziyaret için randevu alabilirsiniz.",
    items: ["Eğitim modeli", "Sosyal imkânlar", "Rehberlik"],
  },
  diger: {
    title: "Özel Duyuru",
    intro: "Kurumumuzdan önemli bir duyuru paylaşıyoruz.",
    trust: "Bilgi için kurumumuza ulaşabilirsiniz.",
    slogan: "Siz değerlisiniz",
    cta: "İletişim bilgilerinden bize ulaşın.",
    footer: "Teşekkür ederiz.",
    items: ["Bilgi 1", "Bilgi 2", "Bilgi 3"],
  },
};

export function afisMetinUret(form: KolayAfisForm): AfisMetin {
  const preset = TUR_METIN[form.afisTuru];
  const kurum = form.kurumAdi.trim();
  const items =
    form.programMaddeleri.filter((x) => x.trim()).length > 0
      ? form.programMaddeleri.filter((x) => x.trim())
      : preset.items;

  const raw: AfisMetin = {
    title: form.baslik.trim() || preset.title,
    subtitle: form.sinifYas.trim() || HEDEF_ALT[form.hedefKitle],
    shortIntro: form.kisaAciklama.trim() || preset.intro,
    trustMessage: preset.trust,
    slogan: preset.slogan,
    featureItems: items.slice(0, LIMIT.featureMax),
    callToAction: preset.cta,
    footerBand: preset.footer,
    contactText: form.telefon.trim() || "İletişim için arayınız",
  };

  if (kurum && form.afisTuru === "yatili_alistirma") {
    raw.shortIntro = raw.shortIntro.replace("program", `${kurum} programı`);
  }

  return yogunlugaGoreFiltre(normalizeAfisMetin(raw), form.yogunluk);
}

function yogunlugaGoreFiltre(m: AfisMetin, yogunluk: BilgiYogunlugu): AfisMetin {
  if (yogunluk === "kisa") {
    return {
      ...m,
      shortIntro: kisalt(m.shortIntro, 80),
      trustMessage: "",
      featureItems: m.featureItems.slice(0, 3),
      footerBand: kisalt(m.footerBand, 48),
    };
  }
  if (yogunluk === "dengeli") {
    return {
      ...m,
      trustMessage: m.trustMessage ? kisalt(m.trustMessage, 100) : "",
      featureItems: m.featureItems.slice(0, 5),
    };
  }
  return m;
}

export function hizliOrnekForm(): Partial<KolayAfisForm> {
  return {
    kurumAdi: "Kemer Öğrenci Yurdu",
    baslik: "Yaz Kampı Başlıyor",
    tarih: "29 Haziran Pazartesi",
    sinifYas: "İlkokul ve Ortaokul",
    telefon: "0 552 532 82 92 / 0545 345 48 85",
    hedefKitle: "karma",
    afisTuru: "yaz_kampi",
    tarz: "enerjik",
    yogunluk: "detayli",
    vurgu: "program_icerigi",
    programMaddeleri: [
      "Kur'an-ı Kerim",
      "Temel Dini Bilgiler",
      "Ders Destek ve Etüt",
      "Kişisel Gelişim",
      "Etkinlik ve İkram",
    ],
  };
}
