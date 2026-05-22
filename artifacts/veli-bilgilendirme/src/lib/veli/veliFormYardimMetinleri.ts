import type { FormData } from "@/types";

export const BOLUM_YARDIM = {
  kimlik: "Bu bilgiler afişin üst kısmında ve imza bölümünde kullanılır. Bir kez kaydederseniz sonraki afişlerde tekrar yazmanız gerekmez.",
  calisma: "Velilere bildirilecek dersi, etkinliği veya çalışmayı burada kısa şekilde tanımlayın. Sistem bunu veliye uygun afiş metnine dönüştürür.",
  sablon: "Afişin görünümünü seçin ve varsa fotoğrafları ekleyin. Fotoğraf eklemezseniz şablon görselsiz düzende çalışır.",
  metin: "Afiş metninin uzunluğunu ve üslubunu belirleyin. İsterseniz oluşan metni düzenleyebilirsiniz.",
  onizleme: "Afişi kontrol edin, ardından PNG / PDF olarak indirin veya WhatsApp için paylaşın.",
} as const;

export const FAALIYET_TURLERI = [
  "Ders",
  "Etüt",
  "Kur'an-ı Kerim",
  "Kitap Okuma",
  "Sosyal Etkinlik",
  "Değerler Eğitimi",
  "Gezi",
  "Etkinlik",
  "Rehberlik",
  "Deneme Sınavı",
  "Genel Bilgilendirme",
] as const;

export type AlanYardim = { label: string; aciklama: string; placeholder: string };

export const ALAN_YARDIM: Record<string, AlanYardim> = {
  isim: {
    label: "Ad Soyad",
    aciklama: "Afişin altında hoca / mesul adı olarak görünür.",
    placeholder: "Örn: Ahmet Yılmaz",
  },
  kurumAdi: {
    label: "Kurum / Yurt Adı",
    aciklama: "Afişin üst kısmında kurum adı olarak görünür.",
    placeholder: "Örn: Kemer Öğrenci Yurdu",
  },
  rol: {
    label: "Unvan / Görev",
    aciklama: "İmza bölümünde adınızın altında görünür.",
    placeholder: "Örn: Eğitim Mesulü, Sınıf Hocası",
  },
  faaliyetTuru: {
    label: "Faaliyet Türü",
    aciklama: "Bugün yapılan çalışmanın türünü seçin. Afiş başlığı ve metin buna göre hazırlanır.",
    placeholder: "",
  },
  alan: {
    label: "Ders / Alan",
    aciklama: "Velilere bildirilecek ders, konu veya etkinlik alanı.",
    placeholder: "Örn: Matematik, Kur'an-ı Kerim, Kitap Okuma",
  },
  ozelNot: {
    label: "Kısa Açıklama / Not",
    aciklama: "Bugün yapılan çalışmayla ilgili kısa not. Boş bırakırsanız sistem otomatik metin oluşturur.",
    placeholder: "Örn: Talebelerimiz problem çözme çalışması yaptı.",
  },
  baslik: {
    label: "Afiş Başlığı",
    aciklama: "Afişin en dikkat çeken başlığıdır. Kısa yazarsanız daha güzel görünür.",
    placeholder: "Örn: Bugün Etüt Çalışması Yaptık",
  },
  posterMetni: {
    label: "Poster Metni",
    aciklama: "Velilere gönderilecek ana bilgilendirme metnidir. Sistem otomatik oluşturur, isterseniz düzenleyebilirsiniz.",
    placeholder: "",
  },
  ekNot: {
    label: "Ek Not",
    aciklama: "Metne eklenecek ek cümle (isteğe bağlı).",
    placeholder: "Örn: Velilerimizle paylaşmanızı rica ederiz.",
  },
};

export const GORSEL_YERLESIM = [
  "1 fotoğraf → büyük kapak görseli olarak kullanılır.",
  "2 fotoğraf → yan yana yerleşir.",
  "3 fotoğraf → 1 büyük + 2 küçük düzen.",
  "4 fotoğraf → galeri / kolaj düzeni oluşur.",
  "Fotoğraf eklemeden de devam edebilirsiniz; sistem görselsiz kurumsal düzene geçer.",
] as const;

export const METIN_UZUNLUK_ACIKLAMA = {
  kisa: "Velilere hızlı bilgi vermek için. Afişte daha temiz görünür.",
  detayli: "Yapılan çalışmayı daha açıklayıcı anlatır. Uzun metinlerde sade şablon önerilir.",
} as const;

export const METIN_TON_ACIKLAMA = {
  kurumsal: "Resmi ve ciddi bilgilendirme dili.",
  sicak: "Daha samimi veli dili.",
  aciklayici: "Detaylı anlatım isteyen çalışmalar için.",
} as const;

export function hizliOrnekForm(): FormData {
  return {
    kurumAdi: "Kemer Öğrenci Yurdu",
    isim: "Ahmet Yılmaz",
    rol: "Eğitim Mesulü",
    faaliyetSayisi: 1,
    faaliyetler: [
      { tur: "Etüt", alan: "Matematik", ozelNot: "Talebelerimiz bugün problem çözme ve konu tekrar çalışması yaptı." },
      { tur: "", alan: "", ozelNot: "" },
      { tur: "", alan: "", ozelNot: "" },
    ],
    metinUzunlugu: "kisa",
    metinTonu: "sicak",
    posterMetni: "",
    ekNot: "",
    gorseller: [],
    seciliBaslikIdx: 0,
  };
}
