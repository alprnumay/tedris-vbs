/** Monogram için Türkçe baş harfler */
export function monogramHarfleri(kurumAdi: string, kisaAd: string, max = 3): string {
  const kaynak = (kisaAd.trim() || kurumAdi.trim()).toUpperCase();
  if (!kaynak) return "TK";
  const kelimeler = kaynak.split(/\s+/).filter(Boolean);
  if (kelimeler.length >= 2) {
    return kelimeler
      .slice(0, max)
      .map((k) => k[0])
      .join("");
  }
  return kaynak.replace(/[^A-ZÇĞİÖŞÜ]/gi, "").slice(0, max) || "T";
}

export function kurumAdiSatirlari(ad: string, maxSatir = 2, maxKarakter = 28): string[] {
  const t = ad.trim();
  if (!t) return ["Kurum Adı"];
  if (t.length <= maxKarakter) return [t];
  const kelimeler = t.split(/\s+/);
  let line = "";
  const lines: string[] = [];
  for (const k of kelimeler) {
    const next = line ? `${line} ${k}` : k;
    if (next.length <= maxKarakter) line = next;
    else {
      if (line) lines.push(line);
      line = k;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxSatir);
}

export function fontFamilyAl(fontPairId: string): string {
  switch (fontPairId) {
    case "klasik_serif":
      return "Georgia, 'Times New Roman', serif";
    case "modern_sans":
      return "system-ui, -apple-system, 'Segoe UI', sans-serif";
    case "guclu_kurumsal":
      return "'Segoe UI', system-ui, sans-serif";
    case "sade_minimal":
    default:
      return "system-ui, -apple-system, sans-serif";
  }
}
