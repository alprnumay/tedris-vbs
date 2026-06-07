import type { ShowcasePost } from "@/modules/davet/types";

export const STORAGE_KEYS = {
  INVITES: "tedris_vbs_davet_invites",
  BOARDING_PROGRAMS: "tedris_vbs_davet_boarding_programs",
  SHOWCASES: "tedris_vbs_davet_showcases",
  LIKES: "tedris_vbs_davet_likes",
  SAVES: "tedris_vbs_davet_saves",
};

const SAMPLE_DATA_VERSION = "v2";
const SAMPLE_VERSION_KEY = "tedris_vbs_davet_sample_version";

export const storage = {
  get: <T>(key: string): T[] => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  },
  set: <T>(key: string, data: T[]): void => {
    localStorage.setItem(key, JSON.stringify(data));
  },
  add: <T extends { id: string }>(key: string, item: T): void => {
    const data = storage.get<T>(key);
    storage.set(key, [...data, item]);
  },
  update: <T extends { id: string }>(key: string, item: T): void => {
    const data = storage.get<T>(key);
    storage.set(
      key,
      data.map((d) => (d.id === item.id ? item : d)),
    );
  },
  remove: (key: string, id: string): void => {
    const data = storage.get<{ id: string }>(key);
    storage.set(
      key,
      data.filter((d) => d.id !== id),
    );
  },
};

export const initSampleData = () => {
  if (!import.meta.env.DEV) return;

  const currentVersion = localStorage.getItem(SAMPLE_VERSION_KEY);
  const showcases = storage.get<ShowcasePost>(STORAGE_KEYS.SHOWCASES);
  if (showcases.length === 0 || currentVersion !== SAMPLE_DATA_VERSION) {
    localStorage.setItem(SAMPLE_VERSION_KEY, SAMPLE_DATA_VERSION);
    const sampleData: ShowcasePost[] = [
      {
        id: "1",
        yurtAdi: "Merkez Yurdu",
        mintika: "Marmara",
        kategori: "Etüt Çalışması",
        baslik: "Verimli Akşam Etüdü",
        fotografUrl:
          "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop",
        amac: "Talebelerin odaklanma süresini artırmak.",
        talebelerNeYapti: "Sessiz ortamda 45 dk etüt, 15 dk mola.",
        kazanim: "Daha iyi ders çalışma alışkanlığı.",
        uygulamaYontemi: "Hocalarımız birebir takiple uyguladı.",
        digerYurtlarNasil: "Aynı sistem rahatlıkla uygulanabilir.",
        sonuc: "Başarılı bir etüt programı.",
        etiketler: ["etüt", "başarı"],
        hocaAdi: "Ahmet Hoca",
        tarih: new Date().toISOString(),
        durum: "yayinda",
        begeniSayisi: 12,
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        yurtAdi: "Çamlık Yurdu",
        mintika: "Ege",
        kategori: "Sosyal Etkinlik",
        baslik: "Hafta Sonu Futbol Turnuvası",
        fotografUrl:
          "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=2029&auto=format&fit=crop",
        amac: "Talebeler arası kaynaşmayı sağlamak.",
        talebelerNeYapti: "Takımlar kuruldu, maçlar yapıldı.",
        kazanim: "Takım ruhu ve kardeşlik bilinci.",
        uygulamaYontemi: "Beden eğitimi saatinde saha kiralandı.",
        digerYurtlarNasil: "Halı saha organizasyonu ile yapılabilir.",
        sonuc: "Çok keyifli bir haftasonu geçirildi.",
        etiketler: ["spor", "kardeşlik"],
        hocaAdi: "Mehmet Hoca",
        tarih: new Date().toISOString(),
        durum: "yayinda",
        begeniSayisi: 8,
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        yurtAdi: "Yıldız Yurdu",
        mintika: "İç Anadolu",
        kategori: "Kitap Okuma",
        baslik: "Akşam Okuma Saati",
        fotografUrl:
          "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=2070&auto=format&fit=crop",
        amac: "Kitap okuma alışkanlığı kazandırmak.",
        talebelerNeYapti: "Herkes kendi seçtiği kitabı okudu.",
        kazanim: "Okuma sevgisi ve kelime dağarcığı gelişimi.",
        uygulamaYontemi: "Her akşam yatmadan önce yarım saat okuma saati yapıldı.",
        digerYurtlarNasil: "Aynı saatte benzer şekilde yapılabilir.",
        sonuc: "Talebeler kitap okumayı sevmeye başladı.",
        etiketler: ["okuma", "kültür"],
        hocaAdi: "Ali Hoca",
        tarih: new Date().toISOString(),
        durum: "yayinda",
        begeniSayisi: 15,
        createdAt: new Date().toISOString(),
      },
    ];
    storage.set(STORAGE_KEYS.SHOWCASES, sampleData);
  }
};
