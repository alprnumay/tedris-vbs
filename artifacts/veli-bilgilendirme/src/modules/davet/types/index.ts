export type ApprovalStatus = 'taslak' | 'onay-bekliyor' | 'yayinda' | 'revize-istendi' | 'reddedildi';

export interface InvitePoster {
  id: string;
  kurumAdi: string;
  programTuru: string;
  davetBasligi: string;
  tarih: string;
  saat: string;
  yer: string;
  kisaAciklama: string;
  katilimNotu?: string;
  iletisimTelefon?: string;
  qrLink?: string;
  sablon: number;
  logoUrl?: string;
  fotografUrl?: string;
}

export interface ProgramAkisi {
  saat: string;
  baslik: string;
  aciklama: string;
}

export interface BoardingProgram {
  id: string;
  kurumAdi: string;
  programBasligi: string;
  programTuru: string;
  tarih: string;
  baslangicSaati: string;
  bitisSaati: string;
  sinifSeviyesi: string;
  kontenjan: string;
  kayitLinki?: string;
  iletisim?: string;
  veliGuvenMesaji: string;
  kisaAciklama: string;
  programAkisi: ProgramAkisi[];
  yanindaGetirmesiGerekenler: string[];
  servisBilgisi?: string;
  sablon: number;
  logoUrl?: string;
  fotografUrls?: string[];
}

export interface ShowcasePost {
  id: string;
  yurtAdi: string;
  mintika: string;
  kategori: string;
  baslik: string;
  fotografUrl?: string;
  amac: string;
  talebelerNeYapti: string;
  kazanim: string;
  uygulamaYontemi: string;
  digerYurtlarNasil: string;
  sonuc: string;
  etiketler: string[];
  hocaAdi: string;
  tarih: string;
  durum: ApprovalStatus;
  revizeNotu?: string;
  /** Sosyal özellik yok; API uyumluluğu için 0 kalır */
  begeniSayisi: number;
  otomatikMetin?: string;
  createdAt: string;
  /** Backend institution_id (opsiyonel) */
  institutionId?: string | null;
}

export interface CountdownItem {
  id: string;
  baslik: string;
  hedefTarih: string;
  hedefSaat: string;
  aciklama?: string;
  kurumAdi: string;
  tema: string;
  logoUrl?: string;
  arkaplanRengi?: string;
}

export interface StudentRecord {
  sira: number;
  talebeAdi: string;
  sinif?: string;
  veliAdi?: string;
  telefon?: string;
  durum: 'hazir' | 'eksik-isim' | 'mukerrer' | 'hatali';
}
