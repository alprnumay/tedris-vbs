import type { DenemeSablonu, DenemeSinaviFormData, Odul, OncelikOgesi } from "@/types/denemeSinavi";

const SIRALI_DEMO: Odul[] = [
  { id: "demo-1", rank: "1.lik", title: "Tablet", description: "" },
  { id: "demo-2", rank: "2.lik", title: "Saat", description: "" },
  { id: "demo-3", rank: "3.lük", title: "Kulaklık", description: "" },
];

const HEDIYE_DEMO: Odul[] = [
  { id: "h1", rank: "Katılımcı", title: "Tablet", description: "" },
  { id: "h2", rank: "Katılımcı", title: "Saat", description: "" },
  { id: "h3", rank: "Katılımcı", title: "Kulaklık", description: "" },
];

const HAVUZ_DEMO = [
  { id: "dh1", ad: "Tablet" },
  { id: "dh2", ad: "Saat" },
  { id: "dh3", ad: "Kulaklık" },
  { id: "dh4", ad: "Forma" },
];

const ORTAK: Pick<
  DenemeSinaviFormData,
  | "afisAmaci"
  | "duzenlemeModu"
  | "kurumAdi"
  | "telefon"
  | "adres"
  | "instagram"
  | "web"
  | "baslik"
  | "tarih"
  | "saat"
  | "sinifModu"
  | "sinifTek"
  | "sinifCoklu"
  | "sinifOzelMetin"
  | "katilimTuru"
  | "odulIlkX"
  | "ilkXKazananGrubu"
  | "ilkXKazananOzel"
  | "katilimHedefi"
  | "katilimHedefOzel"
  | "katilimKisiOpsiyonel"
  | "cekilisKimlerKatilir"
  | "cekilisKacKazanir"
  | "secimHakkiKimde"
  | "secimHakkiOzel"
  | "kayitQrUrl"
  | "odulSartlari"
  | "metinTonu"
  | "duyuruMetni"
  | "ctaTipi"
  | "ctaOzelMetin"
  | "ekGorseller"
> = {
  afisAmaci: "odullu_deneme",
  duzenlemeModu: "standart",
  kurumAdi: "ÖZEL TEDRİS KOLEJİ",
  telefon: "0322 000 00 00",
  adres: "Merkez Kampüs",
  instagram: "@tedriskoleji",
  web: "www.tedris.com",
  baslik: "Ödüllü Türkiye Geneli Deneme Sınavı",
  tarih: "2025-05-15",
  saat: "14:00",
  sinifModu: "ozel",
  sinifTek: "5. sınıf",
  sinifCoklu: [],
  sinifOzelMetin: "5, 6, 7 ve 8. sınıflar",
  katilimTuru: "Kontenjan sınırlı",
  odulIlkX: "10",
  ilkXKazananGrubu: "10",
  ilkXKazananOzel: "",
  katilimHedefi: "tum_katilimcilara",
  katilimHedefOzel: "",
  katilimKisiOpsiyonel: "",
  cekilisKimlerKatilir: "Ön kayıt yaptıran tüm öğrenciler",
  cekilisKacKazanir: "5 kişi",
  secimHakkiKimde: "ilk_10",
  secimHakkiOzel: "",
  kayitQrUrl: "https://tedris.com/kayit",
  odulSartlari: {
    kimKazanir: "İlk 10 dereceye girenler",
    kacKisi: "10 öğrenci",
    sartMetni: "İlk 10’a giren öğrenciler ödül havuzundan birini seçer.",
    not: "Detaylar için kurum ile iletişime geçiniz.",
  },
  metinTonu: "kurumsal",
  duyuruMetni:
    "ÖZEL TEDRİS KOLEJİ olarak 5–8. sınıf öğrencilerimize yönelik ödüllü deneme sınavımıza tüm adayları davet ediyoruz. Sınırlı kontenjan — erken kayıt için hemen başvurun.",
  ctaTipi: "hemen_basvur",
  ctaOzelMetin: "",
  ekGorseller: [],
};

/** Galeri kartlarında şablonun dolu ve farklı görünmesi için örnek veri. */
export function demoPosterForm(sablon: DenemeSablonu): DenemeSinaviFormData {
  const afisFormati: DenemeSinaviFormData["afisFormati"] =
    sablon === "gorsel-odakli" ? "story" : sablon === "enerjik-genclik" ? "kare" : "dikey";

  switch (sablon) {
    case "hero-odul":
      return {
        ...ORTAK,
        sablon,
        afisFormati,
        odulModeli: "sirali",
        oncelikler: ["odul_hediye", "tarih_saat", "kurum_logo", "sinif_seviye", "kayit_basvuru"],
        oduller: SIRALI_DEMO,
        havuzOgeleri: [],
      };
    case "premium-spotlight":
      return {
        ...ORTAK,
        sablon,
        afisFormati,
        odulModeli: "sirali",
        oncelikler: ["odul_hediye", "kurum_logo", "tarih_saat", "sinif_seviye", "duyuru_metni"],
        oduller: SIRALI_DEMO,
        havuzOgeleri: [],
      };
    case "grid-odul":
      return {
        ...ORTAK,
        sablon,
        afisFormati,
        odulModeli: "sirali",
        oncelikler: ["odul_hediye", "sinif_seviye", "tarih_saat", "kurum_logo", "kontenjan"],
        oduller: SIRALI_DEMO,
        havuzOgeleri: [],
      };
    case "cta-odakli":
      return {
        ...ORTAK,
        sablon,
        afisFormati,
        odulModeli: "ilkX",
        oncelikler: ["kayit_basvuru", "odul_hediye", "tarih_saat", "kurum_logo", "sinif_seviye"],
        oduller: [],
        havuzOgeleri: HAVUZ_DEMO,
        odulSartlari: {
          kimKazanir: "İlk 10’a girenler",
          kacKisi: "10",
          sartMetni: "Ödül havuzundan bir seçim hakkı.",
          not: "",
        },
      };
    case "liste-odakli":
      return {
        ...ORTAK,
        sablon,
        afisFormati,
        odulModeli: "cekilis",
        oncelikler: ["odul_hediye", "duyuru_metni", "tarih_saat", "kurum_logo", "iletisim"],
        oduller: HEDIYE_DEMO,
        havuzOgeleri: HAVUZ_DEMO,
        cekilisKimlerKatilir: "Kayıtlı tüm öğrenciler",
        cekilisKacKazanir: "3 kişi",
      };
    case "kurumsal-sade":
      return {
        ...ORTAK,
        sablon,
        afisFormati,
        odulModeli: "sirali",
        oncelikler: ["kurum_logo", "tarih_saat", "odul_hediye", "sinif_seviye", "iletisim"],
        oduller: SIRALI_DEMO,
        havuzOgeleri: [],
      };
    case "minimal":
      return {
        ...ORTAK,
        sablon,
        afisFormati,
        odulModeli: "katilim",
        oncelikler: ["odul_hediye", "kurum_logo", "tarih_saat", "sinif_seviye", "duyuru_metni"],
        oduller: [{ id: "k1", rank: "Katılımcı", title: "Kitapçık", description: "" }],
        havuzOgeleri: [{ id: "p1", ad: "Başarı belgesi" }],
        katilimHedefi: "tum_katilimcilara",
      };
    case "enerjik-genclik":
      return {
        ...ORTAK,
        sablon,
        afisFormati,
        odulModeli: "ilkX",
        oncelikler: ["odul_hediye", "kayit_basvuru", "tarih_saat", "sinif_seviye", "kurum_logo"] satisfies OncelikOgesi[],
        oduller: HEDIYE_DEMO,
        havuzOgeleri: HAVUZ_DEMO.slice(0, 3),
        ilkXKazananGrubu: "20",
      };
    case "qr-odakli":
      return {
        ...ORTAK,
        sablon,
        afisFormati,
        odulModeli: "sirali",
        oncelikler: ["qr_kayit", "odul_hediye", "tarih_saat", "kurum_logo", "kontenjan"],
        oduller: SIRALI_DEMO,
        havuzOgeleri: [],
      };
    case "gorsel-odakli":
      return {
        ...ORTAK,
        sablon,
        afisFormati,
        odulModeli: "ilkX",
        oncelikler: ["tarih_saat", "odul_hediye", "kayit_basvuru", "sinif_seviye", "kurum_logo"],
        oduller: HEDIYE_DEMO,
        havuzOgeleri: [],
        ilkXKazananGrubu: "10",
      };
    default:
      return {
        ...ORTAK,
        sablon,
        afisFormati,
        odulModeli: "sirali",
        oncelikler: ["odul_hediye", "tarih_saat", "kurum_logo", "sinif_seviye", "duyuru_metni"],
        oduller: SIRALI_DEMO,
        havuzOgeleri: [],
      };
  }
}

/** Afişte gösterim: 15 Mayıs 2025 */
export function denemeTarihEtiketi(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "15 Mayıs";
  try {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}
