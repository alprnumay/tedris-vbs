export interface ProgramFlowItem {
  saat: string;
  baslik: string;
  aciklama?: string;
}

export const TARIH_LATER = "Tarih daha sonra bildirilecektir.";

export function hasValue(value?: string | null): boolean {
  return Boolean(value?.trim());
}

export function truncateText(text: string, maxLength: number): string {
  const t = text.trim();
  if (t.length <= maxLength) return t;
  return `${t.slice(0, Math.max(0, maxLength - 1))}…`;
}

export function clampLines(text: string, maxLines: number, maxChars = 240): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "";
  const perLine = Math.ceil(maxChars / maxLines);
  const words = t.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > perLine && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
    if (lines.length >= maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  const joined = lines.slice(0, maxLines).join("\n");
  if (t.length > joined.replace(/\n/g, "").length + 8 || words.length > lines.join(" ").split(" ").length + 2) {
    return truncateText(joined.replace(/\n/g, " "), maxChars);
  }
  return joined;
}

/** Sabit 1600px poster tuvali için başlık boyutu */
export function getPosterTitleClass(text: string): string {
  const len = text.trim().length;
  if (len <= 35) return "text-[58px] leading-[1.05]";
  if (len <= 60) return "text-[48px] leading-[1.1]";
  return "text-[40px] leading-[1.15] line-clamp-2";
}

/** Sabit poster tuvali için gövde metni */
export function getPosterBodyClass(text: string): string {
  const len = text.trim().length;
  if (len <= 120) return "text-[26px] leading-snug";
  if (len <= 220) return "text-[22px] leading-snug";
  return "text-[20px] leading-snug line-clamp-4";
}

export function getPosterKurumClass(): string {
  return "text-[20px] font-semibold uppercase tracking-[0.16em]";
}

export function getPosterMetaClass(): string {
  return "text-[28px] font-semibold leading-tight";
}

export function getPosterMetaLabelClass(): string {
  return "text-[14px] uppercase tracking-[0.2em] font-bold opacity-70";
}

export function getProgramFlowClass(compact: boolean): string {
  return compact ? "text-[18px]" : "text-[22px]";
}

/** @deprecated poster önizlemede getPosterTitleClass kullanın */
export function getTitleClassByLength(text: string): string {
  return getPosterTitleClass(text);
}

/** @deprecated poster önizlemede getPosterBodyClass kullanın */
export function getBodyClassByLength(text: string): string {
  return getPosterBodyClass(text);
}

export function getInviteDateLine(tarih: string): string {
  if (hasValue(tarih)) return tarih.trim();
  return TARIH_LATER;
}

export function getInviteTimeLine(saat: string): string | null {
  if (!hasValue(saat)) return null;
  return saat.trim();
}

export function formatBoardingDate(tarih: string): string {
  if (hasValue(tarih)) return tarih.trim();
  return TARIH_LATER;
}

export function formatBoardingTimeRange(baslangic: string, bitis: string): string | null {
  const hasStart = hasValue(baslangic);
  const hasEnd = hasValue(bitis);
  if (!hasStart && !hasEnd) return null;
  if (hasStart && hasEnd) return `${baslangic.trim()} - ${bitis.trim()}`;
  return (hasStart ? baslangic : bitis)!.trim();
}

export function formatProgramFlowForPoster(items: ProgramFlowItem[], maxItems = 8) {
  const count = items.length;
  const compact = count > 6;
  const shown = items.slice(0, maxItems);
  const hiddenCount = Math.max(0, count - maxItems);
  const note =
    hiddenCount > 0
      ? "Programın devamı için kurumla iletişime geçiniz."
      : count > 10
        ? "Programın devamı için kurumla iletişime geçiniz."
        : null;
  return { items: shown, compact, note, hiddenCount };
}

export function formatChecklistForPoster(items: string[], maxVisible = 6) {
  const visible = items.slice(0, maxVisible);
  const extra = items.length - maxVisible;
  return {
    visible,
    extraLabel: extra > 0 ? `+${extra} diğer` : null,
  };
}

export function slugifyFileName(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "cikti"
  );
}
