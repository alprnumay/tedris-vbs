const DISTRICT_PASSWORD_CODES: Record<string, string> = {
  burdur: "153415",
  merkez: "153415",
  alanya: "073407",
  kemer: "073407",
  manavgat: "073407",
  isparta: "323432",
  aglasun: "153415",
  yesilova: "153415",
};

export const VARSAYILAN_SIFRE = "tedris2026";

export function sifreFromMintika(mintika: string): string {
  const key = mintika.trim().toLowerCase();
  if (DISTRICT_PASSWORD_CODES[key]) return DISTRICT_PASSWORD_CODES[key];
  const partial = Object.entries(DISTRICT_PASSWORD_CODES).find(([k]) => key.includes(k));
  return partial?.[1] ?? VARSAYILAN_SIFRE;
}
