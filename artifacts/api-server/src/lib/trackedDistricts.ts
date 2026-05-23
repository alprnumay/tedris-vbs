/** Takip edilen mıntıkalar — tek kaynak */
export const TRACKED_DISTRICTS = [
  "Burdur",
  "Manavgat",
  "Konaklı",
  "Kepez",
  "Lefkoşa",
  "Kumluca",
  "Serik",
  "Oba",
  "Alanya",
  "Korkuteli",
  "Muratpaşa",
  "Isparta",
] as const;

export type TrackedDistrict = (typeof TRACKED_DISTRICTS)[number];

const DISTRICT_ALIASES: Record<string, TrackedDistrict> = {
  burdur: "Burdur",
  manavgat: "Manavgat",
  konakli: "Konaklı",
  konaklı: "Konaklı",
  kepez: "Kepez",
  lefkosa: "Lefkoşa",
  lefkoşa: "Lefkoşa",
  kumluca: "Kumluca",
  serik: "Serik",
  oba: "Oba",
  alanya: "Alanya",
  korkuteli: "Korkuteli",
  muratpasa: "Muratpaşa",
  muratpaşa: "Muratpaşa",
  isparta: "Isparta",
};

function foldTr(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

/** Mıntıka adını kanonik forma getirir; eşleşmezse null */
export function normalizeDistrictName(raw: string | null | undefined): TrackedDistrict | null {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim();
  const exact = TRACKED_DISTRICTS.find(
    (d) => d.toLocaleLowerCase("tr-TR") === trimmed.toLocaleLowerCase("tr-TR"),
  );
  if (exact) return exact;
  const folded = foldTr(trimmed);
  return DISTRICT_ALIASES[folded] ?? null;
}

export function isTrackedDistrict(raw: string | null | undefined): boolean {
  return normalizeDistrictName(raw) !== null;
}
