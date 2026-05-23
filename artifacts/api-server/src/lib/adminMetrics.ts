import {
  db,
  localUsersTable,
  institutionsTable,
  activityLogsTable,
  type LocalUser,
  type Institution,
} from "@workspace/db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { TRACKED_DISTRICTS, normalizeDistrictName } from "./trackedDistricts";
import { normalizeInstitutionCode } from "./institutionRegistry";
import { TZ, type ResolvedRange } from "./adminDateRange";

export type YurtDurum =
  | "bugun_aktif"
  | "son_7_gun_aktif"
  | "pasif_7"
  | "pasif_30"
  | "hic_giris_yok"
  | "veri_eksik";

export interface YurtMetrik {
  id: string | null;
  institutionCode: string;
  institutionName: string;
  districtName: string;
  province: string | null;
  userCount: number;
  todayLoginUsers: number;
  loginsInRange: number;
  logins7d: number;
  logins30d: number;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  openSupport: number;
  exportPng: number;
  exportPdf: number;
  shareWhatsapp: number;
  activityStatus: YurtDurum;
  registryStatus: string;
  inRegistry: boolean;
  notes: string | null;
  hasDataGap: boolean;
}

export interface MintikaMetrik {
  districtName: string;
  totalYurts: number;
  totalUsers: number;
  todayActiveYurts: number;
  todayActiveUsers: number;
  active7dYurts: number;
  passive7dYurts: number;
  neverLoginYurts: number;
  openSupport: number;
  lastMovementAt: string | null;
  usageRate: number | null;
  healthScore: number | null;
  healthLabel: string;
}

const DAY_MS = 86400000;

function todayStartSync(): Date {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const [y, m, d] = fmt.format(new Date()).split("-").map(Number);
  return new Date(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+03:00`);
}

function daysSince(d: Date | null, now = Date.now()): number | null {
  if (!d) return null;
  return Math.floor((now - d.getTime()) / DAY_MS);
}

function computeYurtStatus(
  userCount: number,
  lastLogin: Date | null,
  todayHasLogin: boolean,
  active7d: boolean,
): YurtDurum {
  if (userCount === 0) return "veri_eksik";
  if (!lastLogin && !todayHasLogin) return "hic_giris_yok";
  if (todayHasLogin) return "bugun_aktif";
  if (active7d) return "son_7_gun_aktif";
  const ds = daysSince(lastLogin);
  if (ds === null) return "hic_giris_yok";
  if (ds >= 30) return "pasif_30";
  if (ds >= 7) return "pasif_7";
  return "son_7_gun_aktif";
}

function healthFromMetrics(m: {
  totalYurts: number;
  active7dYurts: number;
  neverLoginYurts: number;
  openSupport: number;
  dataGapCount: number;
}): { score: number | null; label: string } {
  if (m.totalYurts === 0) return { score: null, label: "Yetersiz veri" };
  const activeRatio = m.active7dYurts / m.totalYurts;
  const neverRatio = m.neverLoginYurts / m.totalYurts;
  let score = Math.round(activeRatio * 100 - neverRatio * 25 - m.openSupport * 3 - m.dataGapCount * 2);
  score = Math.max(0, Math.min(100, score));
  let label = "Zayıf";
  if (score >= 80) label = "İyi";
  else if (score >= 50) label = "Takip edilmeli";
  return { score, label };
}

type UserAgg = {
  users: LocalUser[];
  lastLogin: Date | null;
  todayCount: number;
  active7d: boolean;
  active30d: boolean;
  loginsInRange: number;
};

export async function loadAdminMetricsContext(range: ResolvedRange) {
  const [registry, users, supportRows, activityCountRow] = await Promise.all([
    db.select().from(institutionsTable),
    db.select().from(localUsersTable),
    db.execute(sql`
      SELECT institution_code, COUNT(*)::int AS cnt
      FROM support_requests sr
      LEFT JOIN local_users lu ON lu.id::text = sr.user_id
      WHERE sr.status IN ('yeni', 'inceleniyor')
        AND lu.institution_code IS NOT NULL
      GROUP BY lu.institution_code
    `),
    db.execute(sql`SELECT COUNT(*)::int AS c FROM activity_logs`),
  ]);

  const hasActivityLogs = ((activityCountRow.rows[0] as { c: number })?.c ?? 0) > 0;

  const rangeStart = new Date(range.startIso);
  const rangeEnd = new Date(range.endIso);
  const sevenDaysAgo = new Date(todayStartSync());
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(todayStartSync());
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let loginByCodeRange = new Map<string, number>();
  let loginByCode7d = new Map<string, number>();
  let loginByCode30d = new Map<string, number>();
  let loginByCodeToday = new Map<string, number>();
  let lastActivityByCode = new Map<string, Date>();
  let exportPngByCode = new Map<string, number>();
  let exportPdfByCode = new Map<string, number>();
  let waByCode = new Map<string, number>();

  if (hasActivityLogs) {
    const [rangeLogins, d7, d30, todayLogins, lastActs, pngRows, pdfRows, waRows] = await Promise.all([
      db.execute(sql`
        SELECT institution_code, COUNT(DISTINCT user_id)::int AS cnt
        FROM activity_logs
        WHERE action = 'login' AND institution_code IS NOT NULL AND institution_code != ''
          AND created_at >= ${rangeStart} AND created_at <= ${rangeEnd}
        GROUP BY institution_code
      `),
      db.execute(sql`
        SELECT institution_code, COUNT(DISTINCT user_id)::int AS cnt
        FROM activity_logs
        WHERE action = 'login' AND institution_code IS NOT NULL AND institution_code != ''
          AND created_at >= ${sevenDaysAgo}
        GROUP BY institution_code
      `),
      db.execute(sql`
        SELECT institution_code, COUNT(DISTINCT user_id)::int AS cnt
        FROM activity_logs
        WHERE action = 'login' AND institution_code IS NOT NULL AND institution_code != ''
          AND created_at >= ${thirtyDaysAgo}
        GROUP BY institution_code
      `),
      db.execute(sql`
        SELECT institution_code, COUNT(DISTINCT user_id)::int AS cnt
        FROM activity_logs
        WHERE action = 'login' AND institution_code IS NOT NULL AND institution_code != ''
          AND (created_at AT TIME ZONE ${TZ})::date = (NOW() AT TIME ZONE ${TZ})::date
        GROUP BY institution_code
      `),
      db.execute(sql`
        SELECT institution_code, MAX(created_at) AS last_at
        FROM activity_logs
        WHERE institution_code IS NOT NULL AND institution_code != ''
        GROUP BY institution_code
      `),
      db.execute(sql`
        SELECT institution_code, COUNT(*)::int AS cnt FROM activity_logs
        WHERE action = 'export_png' AND institution_code IS NOT NULL AND institution_code != ''
          AND created_at >= ${rangeStart} AND created_at <= ${rangeEnd}
        GROUP BY institution_code
      `),
      db.execute(sql`
        SELECT institution_code, COUNT(*)::int AS cnt FROM activity_logs
        WHERE action = 'export_pdf' AND institution_code IS NOT NULL AND institution_code != ''
          AND created_at >= ${rangeStart} AND created_at <= ${rangeEnd}
        GROUP BY institution_code
      `),
      db.execute(sql`
        SELECT institution_code, COUNT(*)::int AS cnt FROM activity_logs
        WHERE action = 'share_whatsapp' AND institution_code IS NOT NULL AND institution_code != ''
          AND created_at >= ${rangeStart} AND created_at <= ${rangeEnd}
        GROUP BY institution_code
      `),
    ]);

    const toMap = (rows: { institution_code: string; cnt: number }[]) => {
      const m = new Map<string, number>();
      for (const r of rows) {
        if (r.institution_code) m.set(normalizeInstitutionCode(r.institution_code), r.cnt);
      }
      return m;
    };
    loginByCodeRange = toMap(rangeLogins.rows as { institution_code: string; cnt: number }[]);
    loginByCode7d = toMap(d7.rows as { institution_code: string; cnt: number }[]);
    loginByCode30d = toMap(d30.rows as { institution_code: string; cnt: number }[]);
    loginByCodeToday = toMap(todayLogins.rows as { institution_code: string; cnt: number }[]);
    for (const r of lastActs.rows as { institution_code: string; last_at: Date }[]) {
      if (r.institution_code && r.last_at) {
        lastActivityByCode.set(normalizeInstitutionCode(r.institution_code), new Date(r.last_at));
      }
    }
    exportPngByCode = toMap(pngRows.rows as { institution_code: string; cnt: number }[]);
    exportPdfByCode = toMap(pdfRows.rows as { institution_code: string; cnt: number }[]);
    waByCode = toMap(waRows.rows as { institution_code: string; cnt: number }[]);
  }

  const openSupportByCode = new Map<string, number>();
  for (const r of supportRows.rows as { institution_code: string; cnt: number }[]) {
    if (r.institution_code) {
      openSupportByCode.set(normalizeInstitutionCode(r.institution_code), r.cnt);
    }
  }

  const userByCode = new Map<string, UserAgg>();
  const todayStart = todayStartSync();

  for (const u of users) {
    const code = normalizeInstitutionCode(u.institutionCode);
    if (!code) continue;
    let agg = userByCode.get(code);
    if (!agg) {
      agg = {
        users: [],
        lastLogin: null,
        todayCount: 0,
        active7d: false,
        active30d: false,
        loginsInRange: 0,
      };
      userByCode.set(code, agg);
    }
    agg.users.push(u);
    if (u.lastLoginAt) {
      const t = u.lastLoginAt;
      if (!agg.lastLogin || t > agg.lastLogin) agg.lastLogin = t;
      const loginDay = new Date(t.toLocaleString("en-US", { timeZone: TZ }));
      const today = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
      if (
        loginDay.getFullYear() === today.getFullYear() &&
        loginDay.getMonth() === today.getMonth() &&
        loginDay.getDate() === today.getDate()
      ) {
        agg.todayCount += 1;
      }
      if (t >= sevenDaysAgo) agg.active7d = true;
      if (t >= thirtyDaysAgo) agg.active30d = true;
      if (t >= rangeStart && t <= rangeEnd) agg.loginsInRange += 1;
    }
  }

  const registryByCode = new Map<string, Institution>();
  for (const inst of registry) {
    registryByCode.set(normalizeInstitutionCode(inst.institutionCode), inst);
  }

  const allCodes = new Set<string>();
  for (const code of registryByCode.keys()) allCodes.add(code);
  for (const code of userByCode.keys()) allCodes.add(code);

  const yurts: YurtMetrik[] = [];

  for (const code of allCodes) {
    const reg = registryByCode.get(code);
    const ua = userByCode.get(code);
    const canonicalCode = reg?.institutionCode ?? code;
    const userCount = ua?.users.length ?? 0;

    const districtRaw =
      reg?.districtName ?? ua?.users.find((u) => u.district)?.district ?? "";
    const districtName = normalizeDistrictName(districtRaw) ?? districtRaw;
    const institutionName =
      reg?.institutionName ?? ua?.users.find((u) => u.institutionName)?.institutionName ?? code;
    const province = reg?.province ?? ua?.users.find((u) => u.province)?.province ?? null;

    const todayFromLogs = loginByCodeToday.get(code) ?? 0;
    const todayFromUsers = ua?.todayCount ?? 0;
    const todayLoginUsers = hasActivityLogs
      ? Math.max(todayFromLogs, todayFromUsers)
      : todayFromUsers;

    const active7dFromLogs = (loginByCode7d.get(code) ?? 0) > 0;
    const active7d = hasActivityLogs ? active7dFromLogs || (ua?.active7d ?? false) : (ua?.active7d ?? false);

    const logins7d = hasActivityLogs ? loginByCode7d.get(code) ?? 0 : ua?.active7d ? userCount : 0;
    const logins30d = hasActivityLogs ? loginByCode30d.get(code) ?? 0 : ua?.active30d ? userCount : 0;
    const loginsInRange = hasActivityLogs
      ? loginByCodeRange.get(code) ?? ua?.loginsInRange ?? 0
      : ua?.loginsInRange ?? 0;

    const lastLoginUser = ua?.lastLogin ?? null;
    const lastFromLog = lastActivityByCode.get(code) ?? null;
    const lastLogin =
      lastLoginUser && lastFromLog
        ? lastLoginUser > lastFromLog
          ? lastLoginUser
          : lastFromLog
        : lastLoginUser ?? lastFromLog;
    const lastActivity = lastFromLog ?? lastLoginUser;
    const todayHasYurtLogin = todayLoginUsers > 0;

    const activityStatus = computeYurtStatus(userCount, lastLogin, todayHasYurtLogin, active7d);

    yurts.push({
      id: reg?.id ?? null,
      institutionCode: canonicalCode,
      institutionName,
      districtName,
      province,
      userCount,
      todayLoginUsers,
      loginsInRange,
      logins7d,
      logins30d,
      lastLoginAt: lastLogin?.toISOString() ?? null,
      lastActivityAt: lastActivity?.toISOString() ?? null,
      openSupport: openSupportByCode.get(canonicalCode) ?? openSupportByCode.get(code) ?? 0,
      exportPng: exportPngByCode.get(code) ?? 0,
      exportPdf: exportPdfByCode.get(code) ?? 0,
      shareWhatsapp: waByCode.get(code) ?? 0,
      activityStatus,
      registryStatus: reg?.status ?? "kayitsiz",
      inRegistry: Boolean(reg),
      notes: reg?.notes ?? null,
      hasDataGap: !reg || userCount === 0,
    });
  }

  const trackedSet = new Set<string>(TRACKED_DISTRICTS as unknown as string[]);
  const filteredYurts = yurts.filter((y) => {
    const dn = normalizeDistrictName(y.districtName);
    if (!dn) return y.userCount > 0;
    return trackedSet.has(dn);
  });

  const mintikaMap = new Map<string, MintikaMetrik>();

  for (const d of TRACKED_DISTRICTS) {
    mintikaMap.set(d, {
      districtName: d,
      totalYurts: 0,
      totalUsers: 0,
      todayActiveYurts: 0,
      todayActiveUsers: 0,
      active7dYurts: 0,
      passive7dYurts: 0,
      neverLoginYurts: 0,
      openSupport: 0,
      lastMovementAt: null,
      usageRate: null,
      healthScore: null,
      healthLabel: "Yetersiz veri",
    });
  }

  for (const y of filteredYurts) {
    const dn = normalizeDistrictName(y.districtName) ?? y.districtName;
    if (!dn || !mintikaMap.has(dn)) continue;
    const m = mintikaMap.get(dn)!;
    m.totalYurts += 1;
    m.totalUsers += y.userCount;
    if (y.todayLoginUsers > 0) {
      m.todayActiveYurts += 1;
      m.todayActiveUsers += y.todayLoginUsers;
    }
    if (y.logins7d > 0 || y.activityStatus === "bugun_aktif" || y.activityStatus === "son_7_gun_aktif") {
      m.active7dYurts += 1;
    }
    if (y.activityStatus === "pasif_7" || y.activityStatus === "pasif_30") m.passive7dYurts += 1;
    if (y.activityStatus === "hic_giris_yok") m.neverLoginYurts += 1;
    m.openSupport += y.openSupport;
    const lm = y.lastActivityAt ? new Date(y.lastActivityAt) : null;
    if (lm) {
      const cur = m.lastMovementAt ? new Date(m.lastMovementAt) : null;
      if (!cur || lm > cur) m.lastMovementAt = lm.toISOString();
    }
  }

  for (const m of mintikaMap.values()) {
    m.usageRate =
      m.totalYurts > 0 ? Math.round((m.active7dYurts / m.totalYurts) * 100) : null;
    const dataGap = filteredYurts.filter(
      (y) => normalizeDistrictName(y.districtName) === m.districtName && y.hasDataGap,
    ).length;
    const h = healthFromMetrics({
      totalYurts: m.totalYurts,
      active7dYurts: m.active7dYurts,
      neverLoginYurts: m.neverLoginYurts,
      openSupport: m.openSupport,
      dataGapCount: dataGap,
    });
    m.healthScore = h.score;
    m.healthLabel = h.label;
  }

  const unmatchedUsers = users.filter((u) => {
    if (!u.institutionCode || !u.institutionId) return true;
    const code = normalizeInstitutionCode(u.institutionCode);
    return !registryByCode.has(code);
  });

  return {
    hasActivityLogs,
    yurts: filteredYurts.sort((a, b) => a.districtName.localeCompare(b.districtName, "tr")),
    mintikalar: [...mintikaMap.values()],
    unmatchedUsers,
    registry,
    allUsers: users,
  };
}

export async function loadActivityLogs(params: {
  startIso: string;
  endIso: string;
  district?: string;
  institutionCode?: string;
  action?: string;
  limit?: number;
}) {
  const conditions = [
    gte(activityLogsTable.createdAt, new Date(params.startIso)),
    lte(activityLogsTable.createdAt, new Date(params.endIso)),
  ];
  if (params.district) conditions.push(eq(activityLogsTable.district, params.district));
  if (params.institutionCode) {
    conditions.push(eq(activityLogsTable.institutionCode, params.institutionCode));
  }
  if (params.action) conditions.push(eq(activityLogsTable.action, params.action));

  const rows = await db
    .select()
    .from(activityLogsTable)
    .where(and(...conditions))
    .orderBy(desc(activityLogsTable.createdAt))
    .limit(params.limit ?? 500);

  return rows;
}

export function buildDataHealthIssues(ctx: Awaited<ReturnType<typeof loadAdminMetricsContext>>) {
  const issues: {
    type: string;
    record: string;
    description: string;
    suggestion: string;
  }[] = [];

  for (const y of ctx.yurts) {
    if (y.inRegistry && y.userCount === 0) {
      issues.push({
        type: "yurt_kullanicisiz",
        record: y.institutionName,
        description: "Yurt kaydı var ancak bağlı kullanıcı yok.",
        suggestion: "Kullanıcı oluşturun veya kaydı pasife alın.",
      });
    }
    if (!y.inRegistry && y.userCount > 0) {
      issues.push({
        type: "eslesmemis_kurum",
        record: `${y.institutionName} (${y.institutionCode})`,
        description: "Kullanıcılar var ancak yurt envanterinde kayıt yok.",
        suggestion: "Yurt Kayıt Defterine ekleyin.",
      });
    }
  }

  for (const u of ctx.allUsers) {
    if (!u.institutionCode || !u.institutionName) {
      issues.push({
        type: "kurum_eksik",
        record: u.name,
        description: "Kurum kodu veya adı eksik.",
        suggestion: "Kullanıcı kaydını düzeltin.",
      });
    } else if (!u.institutionId) {
      issues.push({
        type: "kurum_id_eksik",
        record: u.name,
        description: "Kullanıcı kurum kaydına (institutionId) bağlı değil.",
        suggestion: "Veri Sağlığı → Eşleştirmeyi çalıştırın.",
      });
    } else if (!normalizeDistrictName(u.district)) {
      issues.push({
        type: "mintika_eksik",
        record: u.name,
        description: `Mıntıka tanınmıyor: ${u.district ?? "—"}`,
        suggestion: "Mıntıkayı listeden seçin.",
      });
    }
    if (!u.lastLoginAt) {
      issues.push({
        type: "hic_giris",
        record: u.name,
        description: "Hiç giriş kaydı yok.",
        suggestion: "Hatırlatma gönderin.",
      });
    }
  }

  const codeGroups = new Map<string, string[]>();
  for (const inst of ctx.registry) {
    const key = `${normalizeDistrictName(inst.districtName) ?? inst.districtName}-${inst.institutionName.toLowerCase()}`;
    const arr = codeGroups.get(key) ?? [];
    arr.push(inst.institutionCode);
    codeGroups.set(key, arr);
  }
  for (const [key, codes] of codeGroups) {
    if (codes.length > 1) {
      issues.push({
        type: "mukerrer",
        record: key,
        description: `Benzer kurum için birden fazla kod: ${codes.join(", ")}`,
        suggestion: "Kayıtları birleştirin.",
      });
    }
  }

  return issues;
}
