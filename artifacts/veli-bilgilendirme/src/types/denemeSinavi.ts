/** 10 afiş şablonu — yerleşim + tema birlikte tanımlı (eski ID’ler migrate ile eşlenir). */
export type DenemeSablonu =
  | "hero-odul"
  | "grid-odul"
  | "minimal"
  | "kurumsal-sade"
  | "premium-spotlight"
  | "enerjik-genclik"
  | "cta-odakli"
  | "liste-odakli"
  | "qr-odakli"
  | "gorsel-odakli";

export type MetinTonu = "kurumsal" | "heyecanli" | "kisa";

/** Afişin kullanım senaryosu — metin ve yerleşim ipuçları için. */
export type AfisAmaci =
  | "odullu_deneme"
  | "ucretsiz_seviye"
  | "turkiye_geneli"
  | "lgs_tyt_prova"
  | "kayit_daveti"
  | "sonuc_duyurusu";

/** Ödül dağıtım modeli (UI sadece seçilen modu gösterir). */
export type OdulModeli = "sirali" | "ilkX" | "katilim" | "cekilis";

export type DuzenlemeModu = "hizli" | "standart" | "pro";

export type SinifSecimModu = "tek" | "cok" | "ozel";

/** Afiş blok anahtarı — yerleşim ve önizleme sırası. */
export type BolumAnahtari =
  | "kurum"
  | "sosyal"
  | "iletisim"
  | "adres"
  | "qr"
  | "kontenjan_rozet"
  | "ucretsiz"
  | "tarih"
  | "sinif"
  | "amac"
  | "kapak"
  | "baslik"
  | "duyuru"
  | "havuz"
  | "oduller"
  | "sartlar"
  | "cta"
  | "alt";

/** Öncelik kalemi (en fazla 5); afiş hiyerarşisi ve blok sırası. */
export type OncelikOgesi =
  | "odul_hediye"
  | "tarih_saat"
  | "kurum_logo"
  | "sinif_seviye"
  | "ucretsiz_katilim"
  | "kayit_basvuru"
  | "kontenjan"
  | "duyuru_metni"
  | "iletisim"
  | "adres_konum"
  | "sosyal_medya"
  | "qr_kayit";

export const ONCELIK_MAX = 5;

export const ONCELIK_SECENEKLERI: { id: OncelikOgesi; label: string }[] = [
  { id: "odul_hediye", label: "Ödül / Hediye" },
  { id: "tarih_saat", label: "Tarih / Saat" },
  { id: "kurum_logo", label: "Kurum adı / Logo" },
  { id: "sinif_seviye", label: "Sınıf seviyesi" },
  { id: "ucretsiz_katilim", label: "Ücretsiz katılım" },
  { id: "kayit_basvuru", label: "Kayıt / Başvuru" },
  { id: "kontenjan", label: "Kontenjan" },
  { id: "duyuru_metni", label: "Duyuru metni" },
  { id: "iletisim", label: "İletişim" },
  { id: "adres_konum", label: "Adres / Konum" },
  { id: "sosyal_medya", label: "Sosyal medya" },
  { id: "qr_kayit", label: "QR / Kayıt linki" },
];

/** İlk X — kazanan grubu ön ayarı. */
export type IlkXKazananGrubu = "10" | "20" | "50" | "ozel";

/** Katılım hediyesi — hedef kitle. */
export type KatilimHedefi = "tum_katilimcilara" | "kayit_yaptiranlar" | "sinava_girenlere" | "ozel";

/** Ödül havuzu — seçim hakkı. */
export type SecimHakkiKimde = "ilk_10" | "ilk_20" | "dereceye_girenler" | "ozel";

/** Sıralı ödül modelinde aynı seviyede en fazla bir ödül (1./2./3./Özel). */
export const SIRALI_TEK_RANK = ["1.lik", "2.lik", "3.lük", "Özel"] as const;

export type AfisFormati = "kare" | "dikey" | "story" | "a4" | "yatay";

export type CtaTipi = "yok" | "kontenjan" | "hemen_basvur" | "ozel";

export type Odul = {
  id: string;
  rank: string;
  title: string;
  description?: string;
  image?: string;
};

export type HavuzOgesi = {
  id: string;
  ad: string;
};

export type OdulSartlari = {
  kimKazanir: string;
  kacKisi: string;
  sartMetni: string;
  not: string;
};

export type DenemeSinaviFormData = {
  /** Geriye dönük; otomatik metin için — arayüzde seçilmez. */
  afisAmaci: AfisAmaci;
  /** Hızlı = az alan; Pro = tüm ayarlar. */
  duzenlemeModu: DuzenlemeModu;
  kurumAdi: string;
  kurumLogo?: string;
  telefon: string;
  adres: string;
  instagram: string;
  web: string;
  baslik: string;
  tarih: string;
  saat: string;
  sinifModu: SinifSecimModu;
  /** Tek seçim modunda kullanılır */
  sinifTek: string;
  /** Çoklu seçim */
  sinifCoklu: string[];
  /** Özel metin modu */
  sinifOzelMetin: string;
  katilimTuru: string;
  odulModeli: OdulModeli;
  /** "İlk X" modeli için kişi sayısı */
  odulIlkX: string;
  /** İlk X — ön tanımlı grup (10/20/50) veya özel metin */
  ilkXKazananGrubu: IlkXKazananGrubu;
  ilkXKazananOzel: string;
  /** Katılım hediyesi — kimlere */
  katilimHedefi: KatilimHedefi;
  katilimHedefOzel: string;
  /** Katılım — opsiyonel kişi / ölçek notu */
  katilimKisiOpsiyonel: string;
  /** Çekiliş — katılımcı tanımı */
  cekilisKimlerKatilir: string;
  /** Çekiliş — kaç kişi kazanır */
  cekilisKacKazanir: string;
  /** Ödül havuzu — seçim hakkı kimde */
  secimHakkiKimde: SecimHakkiKimde;
  secimHakkiOzel: string;
  /** QR veya kayıt URL (metin olarak saklanır) */
  kayitQrUrl: string;
  oduller: Odul[];
  havuzOgeleri: HavuzOgesi[];
  odulSartlari: OdulSartlari;
  /** Birincil afiş görseli (önerilen). */
  anaGorsel?: string;
  /** Opsiyonel ek görseller. */
  ekGorseller: string[];
  /** Eski kayıtlar — anaGorsel boşsa kullanılır. */
  kapakGorseli?: string;
  ogrenciGorseli?: string;
  arkaPlanGorseli?: string;
  metinTonu: MetinTonu;
  sablon: DenemeSablonu;
  duyuruMetni: string;
  /** Afiş önceliği (normalize: tekrarsız, en fazla 5). */
  oncelikler: OncelikOgesi[];
  afisFormati: AfisFormati;
  ctaTipi: CtaTipi;
  ctaOzelMetin: string;
};

/** Afişte kullanılacak görsel URL’leri: ana + ek (legacy alanlar birleştirilir). */
export function afisGorselDizisi(d: DenemeSinaviFormData): string[] {
  const ana = (d.anaGorsel || d.kapakGorseli || "").trim();
  const ek = (d.ekGorseller?.length ? d.ekGorseller : d.ogrenciGorseli ? [d.ogrenciGorseli] : []).filter((x) => String(x).trim());
  const out: string[] = [];
  if (ana) out.push(ana);
  for (const u of ek) {
    const t = String(u).trim();
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}

export function migrateSablon(raw: string): DenemeSablonu {
  const m: Record<string, DenemeSablonu> = {
    "odul-vurgulu": "hero-odul",
    "basari-derece": "grid-odul",
    "minimal-beyaz": "minimal",
    kurumsal: "kurumsal-sade",
    "premium-altin": "premium-spotlight",
    enerjik: "enerjik-genclik",
    "kampanya-kayit": "cta-odakli",
    "cekilis-temali": "liste-odakli",
    "koyu-modern": "qr-odakli",
    "story-format": "gorsel-odakli",
    "sosyal-dikkat": "enerjik-genclik",
    "seviye-tespit": "minimal",
  };
  if (m[raw]) return m[raw];
  const allowed: DenemeSablonu[] = [
    "hero-odul",
    "grid-odul",
    "minimal",
    "kurumsal-sade",
    "premium-spotlight",
    "enerjik-genclik",
    "cta-odakli",
    "liste-odakli",
    "qr-odakli",
    "gorsel-odakli",
  ];
  return (allowed.includes(raw as DenemeSablonu) ? (raw as DenemeSablonu) : "hero-odul");
}

export function migrateOdulModeli(raw: string): OdulModeli {
  const map: Record<string, OdulModeli> = {
    sirali_123: "sirali",
    ilk_x: "ilkX",
    katilim_hediye: "katilim",
    cekilis: "cekilis",
    secimli: "ilkX",
  };
  if (map[raw]) return map[raw];
  const ok: OdulModeli[] = ["sirali", "ilkX", "katilim", "cekilis"];
  return ok.includes(raw as OdulModeli) ? (raw as OdulModeli) : "sirali";
}

export function normalizeDenemeSinaviForm(d: DenemeSinaviFormData): DenemeSinaviFormData {
  return {
    ...d,
    sablon: migrateSablon(String(d.sablon)),
    odulModeli: migrateOdulModeli(String(d.odulModeli)),
    ekGorseller: Array.isArray(d.ekGorseller) ? d.ekGorseller : [],
  };
}

export function siraliRankMusait(d: DenemeSinaviFormData, rank: string, haricOdulId?: string): boolean {
  if (d.odulModeli !== "sirali") return true;
  if (!SIRALI_TEK_RANK.includes(rank as (typeof SIRALI_TEK_RANK)[number])) return false;
  return !d.oduller.some((o) => o.rank === rank && o.id !== haricOdulId);
}

export const SINIF_SEVIYELERI = [
  "3. sınıf",
  "4. sınıf",
  "5. sınıf",
  "6. sınıf",
  "7. sınıf",
  "8. sınıf",
  "LGS",
  "TYT",
  "AYT",
  "Diğer",
] as const;

export const KATILIM_TURLERI = [
  "Ücretsiz",
  "Ücretli",
  "Kontenjan sınırlı",
  "Ön kayıt zorunlu",
] as const;

/** Ödül seviyesi / sıra etiketi (afiş + form). */
export const ODUL_SEVIYE_SECENEKLERI = ["1.lik", "2.lik", "3.lük", "İlk X", "Katılımcı", "Özel"] as const;

export const ODUL_SIRALARI = ODUL_SEVIYE_SECENEKLERI;

/** Hazır ödül adları — hızlı seçim kütüphanesi. */
export const HAZIR_ODUL_KUTUPHANESI = [
  "Tablet",
  "Telefon",
  "Laptop",
  "Saat",
  "Kulaklık",
  "Bisiklet",
  "Oyun Konsolu",
  "Kitap Seti",
  "Forma",
  "Çanta",
  "Kalem Seti",
  "Hediye Kartı",
  "Burs",
  "Sürpriz",
] as const;

export const AFIS_AMACLARI: { id: AfisAmaci; label: string; kisa: string }[] = [
  { id: "odullu_deneme", label: "Ödüllü deneme sınavı", kisa: "Derece ve ödül odaklı" },
  { id: "ucretsiz_seviye", label: "Ücretsiz seviye tespit", kisa: "Placement / ücretsiz tanı" },
  { id: "turkiye_geneli", label: "Türkiye geneli duyuru", kisa: "Geniş kitle, marka" },
  { id: "lgs_tyt_prova", label: "LGS / TYT prova", kisa: "Sınav hazırlık" },
  { id: "kayit_daveti", label: "Kayıt daveti", kisa: "Kayıt ve başvuru" },
  { id: "sonuc_duyurusu", label: "Sonuç duyurusu", kisa: "Açıklama / sonuç" },
];

export const ODUL_MODELLERI: { id: OdulModeli; label: string; aciklama: string }[] = [
  { id: "sirali", label: "Sıralı ödül", aciklama: "1., 2., 3. — her biri ayrı kart." },
  { id: "ilkX", label: "İlk X kişi", aciklama: "Tek başlık + ödül listesi veya havuz kartları." },
  { id: "katilim", label: "Katılım hediyesi", aciklama: "Herkes kazanır — rozet / etiket düzeni." },
  { id: "cekilis", label: "Çekiliş", aciklama: "Ödül veya havuz + şart metni öne çıkar." },
];

export function yeniOdulId(): string {
  return `odul-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function yeniHavuzId(): string {
  return `havuz-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Sıralı ödül dışında derece satırı gösterilmez. */
export function afisteDereceGoster(d: DenemeSinaviFormData): boolean {
  return d.odulModeli === "sirali";
}

/** Ödül satırı formda gösterilsin mi (sıralı / çekiliş / katılım / ilkX özel kartlar). */
export function odulListesiFormdaGoster(d: DenemeSinaviFormData): boolean {
  return d.odulModeli === "sirali" || d.odulModeli === "cekilis" || d.odulModeli === "ilkX";
}

/** İlk X afiş başlığı için kısa grup etiketi. */
export function ilkXKazananEtiketi(d: DenemeSinaviFormData): string {
  if (d.ilkXKazananGrubu === "ozel" && d.ilkXKazananOzel.trim()) return d.ilkXKazananOzel.trim();
  if (d.ilkXKazananGrubu === "10") return "İlk 10";
  if (d.ilkXKazananGrubu === "20") return "İlk 20";
  if (d.ilkXKazananGrubu === "50") return "İlk 50";
  const x = d.odulIlkX.trim() || "X";
  return `İlk ${x}`;
}

export function katilimHedefBasligi(d: DenemeSinaviFormData): string {
  switch (d.katilimHedefi) {
    case "tum_katilimcilara":
      return "Tüm Katılımcılara Hediye";
    case "kayit_yaptiranlar":
      return "Kayıt Yaptıranlara Hediye";
    case "sinava_girenlere":
      return "Sınava Girenlere Hediye";
    default:
      return d.katilimHedefOzel.trim() || "Katılım Hediyesi";
  }
}

export function secimHakkiEtiketi(d: DenemeSinaviFormData): string {
  switch (d.secimHakkiKimde) {
    case "ilk_10":
      return "İlk 10";
    case "ilk_20":
      return "İlk 20";
    case "dereceye_girenler":
      return "Dereceye girenler";
    default:
      return d.secimHakkiOzel.trim() || "Belirlenen grup";
  }
}

export function siraliOdulSirala(oduller: Odul[]): Odul[] {
  const sira = ["1.lik", "2.lik", "3.lük", "Özel"];
  return [...oduller].sort((a, b) => sira.indexOf(a.rank) - sira.indexOf(b.rank));
}

export function sinifBadgeMetni(d: DenemeSinaviFormData): string {
  if (d.sinifModu === "ozel") {
    const t = d.sinifOzelMetin.trim();
    return t || "Sınıf bilgisi";
  }
  if (d.sinifModu === "cok") {
    if (d.sinifCoklu.length === 0) return "Çoklu sınıf";
    if (d.sinifCoklu.length <= 4) return d.sinifCoklu.join(" · ");
    return `${d.sinifCoklu.slice(0, 3).join(" · ")} +${d.sinifCoklu.length - 3}`;
  }
  return d.sinifTek || "Sınıf";
}

export function bosDenemeFormu(): DenemeSinaviFormData {
  return {
    afisAmaci: "odullu_deneme",
    duzenlemeModu: "hizli",
    kurumAdi: "",
    telefon: "",
    adres: "",
    instagram: "",
    web: "",
    baslik: "Ödüllü Türkiye Geneli Deneme Sınavı",
    tarih: "",
    saat: "",
    sinifModu: "tek",
    sinifTek: "5. sınıf",
    sinifCoklu: [],
    sinifOzelMetin: "",
    katilimTuru: "Kontenjan sınırlı",
    odulModeli: "sirali",
    odulIlkX: "10",
    ilkXKazananGrubu: "10",
    ilkXKazananOzel: "",
    katilimHedefi: "tum_katilimcilara",
    katilimHedefOzel: "",
    katilimKisiOpsiyonel: "",
    cekilisKimlerKatilir: "",
    cekilisKacKazanir: "",
    secimHakkiKimde: "ilk_10",
    secimHakkiOzel: "",
    kayitQrUrl: "",
    anaGorsel: undefined,
    ekGorseller: [],
    oduller: [],
    havuzOgeleri: [],
    odulSartlari: { kimKazanir: "", kacKisi: "", sartMetni: "", not: "" },
    metinTonu: "kurumsal",
    sablon: "hero-odul",
    duyuruMetni: "",
    oncelikler: ["odul_hediye", "tarih_saat", "kurum_logo", "sinif_seviye", "kayit_basvuru"],
    afisFormati: "dikey",
    ctaTipi: "hemen_basvur",
    ctaOzelMetin: "",
  };
}
