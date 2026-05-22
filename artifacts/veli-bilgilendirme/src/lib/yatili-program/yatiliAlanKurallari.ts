import type { YatiliOtomatikMetin } from "@/types/yatiliProgram";

export const LIMIT = {
  programTitleChars: 60,
  shortIntro: 160,
  trustMessage: 160,
  parentNote: 120,
  activityMin: 3,
  activityMax: 5,
  activityItem: 45,
  sloganWords: 8,
  callToAction: 100,
  kurumAdi: 48,
} as const;

export function fitTitle(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= LIMIT.programTitleChars) return t;
  const words = t.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > 32 && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
    if (lines.length >= 2) break;
  }
  if (lines.length < 2 && line) lines.push(line);
  return lines.slice(0, 2).join("\n").slice(0, LIMIT.programTitleChars);
}

export function fitBodyText(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.55 ? cut.slice(0, lastSpace) : cut) + "…";
}

export function fitSlogan(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, LIMIT.sloganWords).join(" ");
}

export function clampActivities(items: string[]): string[] {
  const cleaned = items
    .map((m) => m.trim())
    .filter(Boolean)
    .map((m) => (m.length > LIMIT.activityItem ? `${m.slice(0, LIMIT.activityItem - 1)}…` : m));
  const uniq = [...new Set(cleaned)];
  if (uniq.length < LIMIT.activityMin) {
    while (uniq.length < LIMIT.activityMin) {
      uniq.push("Akşam etüdü ve rehberlik");
    }
  }
  return uniq.slice(0, LIMIT.activityMax);
}

export function fitKurumAdi(name: string): string {
  const t = name.trim();
  if (t.length <= LIMIT.kurumAdi) return t;
  return `${t.slice(0, LIMIT.kurumAdi - 1)}…`;
}

export function normalizeYatiliMetin(m: YatiliOtomatikMetin): YatiliOtomatikMetin {
  return {
    programTitle: fitTitle(m.programTitle),
    shortIntro: fitBodyText(m.shortIntro, LIMIT.shortIntro),
    trustMessage: fitBodyText(m.trustMessage, LIMIT.trustMessage),
    activities: clampActivities(m.activities),
    parentNote: fitBodyText(m.parentNote, LIMIT.parentNote),
    slogan: fitSlogan(m.slogan),
    callToAction: fitBodyText(m.callToAction, LIMIT.callToAction),
  };
}
