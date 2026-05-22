const BASE = 520;

export function afisPosterBoyutlari(): { width: number; minHeight: number } {
  return { width: BASE, minHeight: Math.round(BASE * 1.41421356) };
}
