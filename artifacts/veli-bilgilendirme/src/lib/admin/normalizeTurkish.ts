const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", I: "i", İ: "i", i: "i",
  ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
};

/** E-posta local part: boşluksuz, tire/nokta yok, sadece a-z0-9 */
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

function isBoundary(ch: string | undefined): boolean {
  return !ch || /[^A-Za-zÇĞİÖŞÜçğıöşü0-9]/.test(ch);
}

export function removeDistrictPrefixFromInstitutionName(districtName: string, institutionName: string): string {
  const districtNorm = normalizeTurkish(districtName);
  const original = institutionName.trim();
  if (!districtNorm || !original) return original;

  let consumedNorm = "";
  for (let i = 0; i < original.length; i += 1) {
    consumedNorm = normalizeTurkish(original.slice(0, i + 1));
    if (consumedNorm === districtNorm && isBoundary(original[i + 1])) {
      const cleaned = original.slice(i + 1).trim();
      return cleaned || original;
    }
    if (consumedNorm.length > districtNorm.length) break;
  }

  return original;
}

/** Kurum kodu: tireli slug */
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
