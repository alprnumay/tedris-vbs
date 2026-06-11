/** wouter base=/davet iken kullanılan göreli yollar (tarayıcı: /davet/...) */
export const OKUL_TAKIP_HOME = "/okul-takip";
export const OKUL_TAKIP_GUNLUK = "/okul-takip/gunluk";
export const OKUL_TAKIP_RAPORLAR = "/okul-takip/raporlar";
export const OKUL_TAKIP_KARNELER = "/okul-takip/karneler";
export const OKUL_TAKIP_RISKLI = "/okul-takip/riskli";
export const OKUL_TAKIP_OGRENCILER = "/okul-takip/ogrenciler";

export function okulTakipKarnePath(studentId: string, week?: string): string {
  const base = `${OKUL_TAKIP_KARNELER}/${studentId}`;
  return week ? `${base}?week=${week}` : base;
}

/** Tarayıcı adres çubuğundaki tam yol */
export const OKUL_TAKIP_ABSOLUTE = {
  home: "/davet/okul-takip",
  gunluk: "/davet/okul-takip/gunluk",
  raporlar: "/davet/okul-takip/raporlar",
  karneler: "/davet/okul-takip/karneler",
  riskli: "/davet/okul-takip/riskli",
  ogrenciler: "/davet/okul-takip/ogrenciler",
} as const;

export const NEHARI_PLATFORM_HOME = "/";

export const NOTIFICATION_SETTINGS = "/bildirim-ayarlari";
