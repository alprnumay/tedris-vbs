const TR_MAP: Record<string, string> = {
  ğ: "g", ü: "u", ş: "s", ı: "i", ö: "o", ç: "c",
  Ğ: "g", Ü: "u", Ş: "s", İ: "i", I: "i", Ö: "o", Ç: "c",
};

export function kurumKoduOner(district: string, institutionName: string): string {
  const slug = (input: string) => {
    let s = input.trim();
    for (const [from, to] of Object.entries(TR_MAP)) s = s.split(from).join(to);
    return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  };
  return [slug(district), slug(institutionName)].filter(Boolean).join("-");
}

export function hatirlatmaMesaji(ad?: string): string {
  const hitap = ad?.trim() ? ` ${ad.trim()}` : "";
  return `Hocam${hitap}, Nehari Veli Bilgilendirme hesabınız aktif görünüyor ancak son günlerde giriş yapılmamış. Veli bilgilendirme afişlerinizi sistem üzerinden kolayca hazırlayabilirsiniz.`;
}

