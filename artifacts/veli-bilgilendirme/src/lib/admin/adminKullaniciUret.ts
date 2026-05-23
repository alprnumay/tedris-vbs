import { normalizeTurkish, slugifyKurum } from "./normalizeTurkish";

export const MINTIKA_IL: Record<string, string> = {
  alanya: "Antalya",
  kemer: "Antalya",
  manavgat: "Antalya",
  burdur: "Burdur",
  merkez: "Burdur",
  aglasun: "Burdur",
  ağlasun: "Burdur",
  yesilova: "Burdur",
  yeşilova: "Burdur",
  isparta: "Isparta",
  "isparta merkez": "Isparta",
};

export const DISTRICT_PASSWORD_CODES: Record<string, string> = {
  burdur: "153415",
  merkez: "153415",
  alanya: "073407",
  kemer: "073407",
  manavgat: "073407",
  isparta: "323432",
  aglasun: "153415",
  ağlasun: "153415",
  yesilova: "153415",
  yeşilova: "153415",
};

export const VARSAYILAN_SIFRE = "tedris2026";

export const BILINEN_MINTIKALAR = [
  "Alanya", "Kemer", "Manavgat", "Burdur", "Merkez", "Ağlasun", "Yeşilova", "Isparta",
];

export function ilTahminEt(mintika: string): string {
  const key = mintika.trim().toLowerCase();
  if (MINTIKA_IL[key]) return MINTIKA_IL[key];
  if (key.includes("isparta")) return "Isparta";
  if (["alanya", "kemer", "manavgat"].some((m) => key.includes(m))) return "Antalya";
  if (["burdur", "aglasun", "ağlasun", "yesilova", "yeşilova", "merkez"].some((m) => key.includes(m))) {
    return "Burdur";
  }
  return "";
}

export function epostaUret(mintika: string, kurumAdi: string): string {
  const local = normalizeTurkish(mintika) + normalizeTurkish(kurumAdi);
  return local ? `${local}@gmail.com` : "";
}

export function epostaAlternatif(mintika: string, kurumAdi: string, suffix: number): string {
  const local = normalizeTurkish(mintika) + normalizeTurkish(kurumAdi);
  return local ? `${local}${suffix}@gmail.com` : "";
}

export function kurumKoduUret(mintika: string, kurumAdi: string): string {
  return slugifyKurum(mintika, kurumAdi);
}

export function sifreUret(mintika: string): { sifre: string; uyar?: string } {
  const key = mintika.trim().toLowerCase();
  const kod = DISTRICT_PASSWORD_CODES[key];
  if (kod) return { sifre: kod };
  const partial = Object.entries(DISTRICT_PASSWORD_CODES).find(([k]) => key.includes(k));
  if (partial) return { sifre: partial[1] };
  return {
    sifre: VARSAYILAN_SIFRE,
    uyar: "Bu mıntıka için özel şifre kodu tanımlı değil; varsayılan şifre kullanıldı.",
  };
}

export function girisBilgisiMetni(p: {
  name: string;
  email: string;
  password: string;
  mintika: string;
  kurum: string;
  il?: string;
  rol: string;
}): string {
  return [
    "Tedris VBS giriş bilgileriniz:",
    `E-posta: ${p.email}`,
    `Geçici şifre: ${p.password}`,
    `Kurum: ${p.kurum}`,
    `Mıntıka: ${p.mintika}`,
    p.il ? `İl: ${p.il}` : "",
    `Rol: ${p.rol}`,
    "Giriş yaptıktan sonra bilgilerinizi kontrol ediniz.",
  ]
    .filter(Boolean)
    .join("\n");
}
