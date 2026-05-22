import type { AfisMetin } from "@/types/kolayAfis";

export const LIMIT = {
  title: 48,
  subtitle: 56,
  shortIntro: 140,
  trustMessage: 160,
  slogan: 56,
  featureItem: 36,
  featureMax: 6,
  featureMin: 3,
  cta: 100,
  footer: 72,
  kurum: 40,
} as const;

export function kisalt(metin: string, max: number): string {
  const t = metin.trim();
  if (t.length <= max) return t;
  const kes = t.slice(0, max);
  const son = kes.lastIndexOf(" ");
  return (son > max * 0.5 ? kes.slice(0, son) : kes).trim() + "…";
}

export function normalizeAfisMetin(m: AfisMetin): AfisMetin {
  const items = m.featureItems
    .map((x) => kisalt(x, LIMIT.featureItem))
    .filter(Boolean)
    .slice(0, LIMIT.featureMax);
  while (items.length < LIMIT.featureMin && m.featureItems.length > 0) {
    items.push(m.featureItems[items.length] ?? "");
  }
  return {
    title: kisalt(m.title, LIMIT.title),
    subtitle: kisalt(m.subtitle, LIMIT.subtitle),
    shortIntro: kisalt(m.shortIntro, LIMIT.shortIntro),
    trustMessage: kisalt(m.trustMessage, LIMIT.trustMessage),
    slogan: kisalt(m.slogan, LIMIT.slogan),
    featureItems: items.length ? items : m.featureItems.slice(0, LIMIT.featureMin),
    callToAction: kisalt(m.callToAction, LIMIT.cta),
    footerBand: kisalt(m.footerBand, LIMIT.footer),
    contactText: m.contactText.trim(),
  };
}
