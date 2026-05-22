const KURUM_TUR_PARCALARI = ["KURUMU", "KURUM", "YURDU", "YURT", "OKULU", "OKUL", "KOLEJ", "AKADEM", "ÖĞRENCİ"];

const PRIMARY_MAX_CHARS = 20;
const SECONDARY_MAX_CHARS = 26;

export function uppercaseTr(text: string): string {
  return text.trim().toLocaleUpperCase("tr-TR");
}

function clampInstitutionLines(primary: string, secondary: string): { primary: string; secondary: string } {
  let p = uppercaseTr(primary);
  let s = uppercaseTr(secondary);

  if (p.length > PRIMARY_MAX_CHARS) {
    const words = p.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      const moved = words.pop()!;
      s = s ? `${moved} ${s}` : moved;
      p = words.join(" ");
    }
  }

  if (s.length > SECONDARY_MAX_CHARS) {
    s = `${s.slice(0, SECONDARY_MAX_CHARS - 1)}…`;
  }

  return { primary: p, secondary: s };
}

/** Kurum adını ana + alt satıra böler */
export function splitInstitutionName(name: string): { primary: string; secondary: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { primary: "KURUM ADI", secondary: "" };
  if (parts.length === 1) return clampInstitutionLines(parts[0], "");

  const tailUpper = parts.slice(1).join(" ").toLocaleUpperCase("tr-TR");
  const turMu = KURUM_TUR_PARCALARI.some((k) => tailUpper.includes(k));
  if (turMu) {
    return clampInstitutionLines(parts[0], parts.slice(1).join(" "));
  }

  if (parts.length === 2) return clampInstitutionLines(parts[0], parts[1]);
  if (parts[0].length >= 8) return clampInstitutionLines(parts[0], parts.slice(1).join(" "));
  return clampInstitutionLines(parts.slice(0, 2).join(" "), parts.slice(2).join(" "));
}

export function getPrimaryLine(name: string): string {
  return splitInstitutionName(name).primary;
}

export function getSecondaryLine(name: string): string {
  return splitInstitutionName(name).secondary;
}

export function kurumBaslikHiyerarsi(kurumAdi: string): { ana: string; alt: string } {
  const { primary, secondary } = splitInstitutionName(kurumAdi);
  return { ana: primary, alt: secondary };
}

export function fitTextSize(text: string, baseSize: number, minSize: number, maxChars: number): number {
  const len = text.length;
  if (len <= maxChars) return baseSize;
  if (len <= maxChars + 6) return Math.max(minSize, baseSize - 2);
  if (len <= maxChars + 14) return Math.max(minSize, baseSize - 5);
  if (len <= maxChars + 22) return Math.max(minSize, baseSize - 8);
  return minSize;
}

/** Monogram font — harf sayısına göre sabit ölçek */
export function fitMonogramSize(text: string): number {
  const len = uppercaseTr(text).length;
  if (len <= 3) return 104;
  if (len === 4) return 92;
  if (len === 5) return 80;
  return 68;
}

export function monogramHarfleri(kurumAdi: string, kisaAd: string, max = 5): string {
  const kaynak = (kisaAd.trim() || kurumAdi.trim()).toLocaleUpperCase("tr-TR");
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

export function kurumAdiSatirlari(ad: string, maxSatir = 2, _maxKarakter = 28): string[] {
  const { primary, secondary } = splitInstitutionName(ad.trim() || "Kurum Adı");
  return [primary, secondary].filter(Boolean).slice(0, maxSatir);
}

export function yayFontBoyutu(metinUzunlugu: number, taban = 13, min = 11): number {
  if (metinUzunlugu <= 22) return taban;
  if (metinUzunlugu <= 34) return taban - 1;
  if (metinUzunlugu <= 46) return taban - 2;
  return min;
}

export function sehirYilMetni(sehir: string, ilce: string, yil: string): string {
  const parcalar: string[] = [];
  if (sehir.trim()) parcalar.push(ilce.trim() ? `${sehir.trim()} · ${ilce.trim()}` : sehir.trim());
  if (yil.trim()) parcalar.push(`Kuruluş ${yil.trim()}`);
  return parcalar.join("  ·  ");
}

export function fontFamilyAl(fontPairId: string): string {
  switch (fontPairId) {
    case "klasik_serif":
      return "Georgia, 'Times New Roman', serif";
    case "modern_sans":
      return '"Trebuchet MS", "Segoe UI", Arial, sans-serif';
    case "guclu_kurumsal":
        return '"Arial Black", Arial, sans-serif';
    case "sade_minimal":
    default:
      return '"Segoe UI", Arial, sans-serif';
  }
}
