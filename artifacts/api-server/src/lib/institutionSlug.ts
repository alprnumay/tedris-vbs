const TR_MAP: Record<string, string> = {
  ğ: "g",
  ü: "u",
  ş: "s",
  ı: "i",
  ö: "o",
  ç: "c",
  Ğ: "g",
  Ü: "u",
  Ş: "s",
  İ: "i",
  I: "i",
  Ö: "o",
  Ç: "c",
};

export function slugifyTr(input: string): string {
  let s = input.trim();
  for (const [from, to] of Object.entries(TR_MAP)) {
    s = s.split(from).join(to);
  }
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function kurumKoduOner(district: string, institutionName: string): string {
  const parts = [slugifyTr(district), slugifyTr(institutionName)].filter(Boolean);
  return parts.join("-");
}
