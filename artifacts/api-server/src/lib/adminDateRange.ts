export const TZ = "Europe/Istanbul";

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "this_month"
  | "last_month"
  | "period"
  | "season"
  | "custom";

export interface PeriodSettings {
  periodStart?: string | null;
  periodEnd?: string | null;
  seasonStart?: string | null;
  seasonEnd?: string | null;
}

export interface ResolvedRange {
  preset: DateRangePreset;
  label: string;
  startIso: string;
  endIso: string;
  warning?: string;
}

function istanbulParts(d = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, day] = fmt.format(d).split("-").map(Number);
  return { y, m, day };
}

function startOfDayIstanbul(y: number, m: number, day: number): Date {
  const iso = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+03:00`;
  return new Date(iso);
}

function endOfDayIstanbul(y: number, m: number, day: number): Date {
  const iso = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}T23:59:59.999+03:00`;
  return new Date(iso);
}

function parseDateOnly(s: string): { y: number; m: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), day: Number(m[3]) };
}

export function resolveDateRange(
  preset: string,
  opts?: {
    customStart?: string;
    customEnd?: string;
    settings?: PeriodSettings;
  },
): ResolvedRange {
  const now = new Date();
  const { y, m, day } = istanbulParts(now);
  const todayStart = startOfDayIstanbul(y, m, day);
  const todayEnd = endOfDayIstanbul(y, m, day);

  const p = (preset || "7d") as DateRangePreset;

  if (p === "today") {
    return {
      preset: p,
      label: "Bugün",
      startIso: todayStart.toISOString(),
      endIso: todayEnd.toISOString(),
    };
  }

  if (p === "yesterday") {
    const ys = new Date(todayStart);
    ys.setDate(ys.getDate() - 1);
    const { y: yy, m: mm, day: dd } = istanbulParts(ys);
    return {
      preset: p,
      label: "Dün",
      startIso: startOfDayIstanbul(yy, mm, dd).toISOString(),
      endIso: endOfDayIstanbul(yy, mm, dd).toISOString(),
    };
  }

  if (p === "7d") {
    const s = new Date(todayStart);
    s.setDate(s.getDate() - 6);
    return {
      preset: p,
      label: "Son 7 gün",
      startIso: s.toISOString(),
      endIso: todayEnd.toISOString(),
    };
  }

  if (p === "30d") {
    const s = new Date(todayStart);
    s.setDate(s.getDate() - 29);
    return {
      preset: p,
      label: "Son 30 gün",
      startIso: s.toISOString(),
      endIso: todayEnd.toISOString(),
    };
  }

  if (p === "this_month") {
    return {
      preset: p,
      label: "Bu ay",
      startIso: startOfDayIstanbul(y, m, 1).toISOString(),
      endIso: todayEnd.toISOString(),
    };
  }

  if (p === "last_month") {
    const lm = m === 1 ? 12 : m - 1;
    const ly = m === 1 ? y - 1 : y;
    const lastDay = new Date(ly, lm, 0).getDate();
    return {
      preset: p,
      label: "Geçen ay",
      startIso: startOfDayIstanbul(ly, lm, 1).toISOString(),
      endIso: endOfDayIstanbul(ly, lm, lastDay).toISOString(),
    };
  }

  if (p === "period") {
    const ps = opts?.settings?.periodStart;
    const pe = opts?.settings?.periodEnd;
    if (!ps || !pe) {
      return {
        preset: p,
        label: "Bu dönem",
        startIso: todayStart.toISOString(),
        endIso: todayEnd.toISOString(),
        warning: "Dönem tarihi tanımlanmamış. Ayarlar sekmesinden tanımlayın.",
      };
    }
    const a = parseDateOnly(ps);
    const b = parseDateOnly(pe);
    if (!a || !b) {
      return {
        preset: p,
        label: "Bu dönem",
        startIso: todayStart.toISOString(),
        endIso: todayEnd.toISOString(),
        warning: "Dönem tarihleri geçersiz.",
      };
    }
    return {
      preset: p,
      label: `Dönem (${ps} – ${pe})`,
      startIso: startOfDayIstanbul(a.y, a.m, a.day).toISOString(),
      endIso: endOfDayIstanbul(b.y, b.m, b.day).toISOString(),
    };
  }

  if (p === "season") {
    const ps = opts?.settings?.seasonStart;
    const pe = opts?.settings?.seasonEnd;
    if (!ps || !pe) {
      return {
        preset: p,
        label: "Bu sezon",
        startIso: todayStart.toISOString(),
        endIso: todayEnd.toISOString(),
        warning: "Sezon tarihi tanımlanmamış. Ayarlar sekmesinden tanımlayın.",
      };
    }
    const a = parseDateOnly(ps);
    const b = parseDateOnly(pe);
    if (!a || !b) {
      return {
        preset: p,
        label: "Bu sezon",
        startIso: todayStart.toISOString(),
        endIso: todayEnd.toISOString(),
        warning: "Sezon tarihleri geçersiz.",
      };
    }
    return {
      preset: p,
      label: `Sezon (${ps} – ${pe})`,
      startIso: startOfDayIstanbul(a.y, a.m, a.day).toISOString(),
      endIso: endOfDayIstanbul(b.y, b.m, b.day).toISOString(),
    };
  }

  if (p === "custom" && opts?.customStart && opts?.customEnd) {
    const a = parseDateOnly(opts.customStart);
    const b = parseDateOnly(opts.customEnd);
    if (a && b) {
      return {
        preset: p,
        label: `${opts.customStart} – ${opts.customEnd}`,
        startIso: startOfDayIstanbul(a.y, a.m, a.day).toISOString(),
        endIso: endOfDayIstanbul(b.y, b.m, b.day).toISOString(),
      };
    }
  }

  const s = new Date(todayStart);
  s.setDate(s.getDate() - 6);
  return {
    preset: "7d",
    label: "Son 7 gün",
    startIso: s.toISOString(),
    endIso: todayEnd.toISOString(),
  };
}
