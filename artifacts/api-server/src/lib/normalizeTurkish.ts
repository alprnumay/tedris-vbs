const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", I: "i", İ: "i", i: "i",
  ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
};

export function normalizeTurkish(text: string): string {
  let s = text.trim();
  for (const [from, to] of Object.entries(TR_MAP)) {
    s = s.split(from).join(to);
  }
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^-+|-+$/g, "");
}

export function slugifyKurum(...parts: string[]): string {
  const birlesik = parts
    .map((p) => {
      let s = p.trim();
      for (const [from, to] of Object.entries(TR_MAP)) {
        s = s.split(from).join(to);
      }
      return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
    })
    .filter(Boolean);
  return birlesik.join("-");
}
