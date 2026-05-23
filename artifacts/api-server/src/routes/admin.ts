import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import {
  db,
  localUsersTable,
  supportRequestsTable,
  type LocalUser,
} from "@workspace/db";
import { eq, and, or, ilike, sql, desc, isNull, isNotNull } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAdmin";
import { kurumKoduOner } from "../lib/institutionSlug";
import { normalizeRole } from "../lib/roleUtils";
import { sifreFromMintika } from "../lib/mintikaSifre";
import { resolveInstitution, linkUserToInstitution } from "../lib/institutionRegistry";
import { normalizeDistrictName } from "../lib/trackedDistricts";

const router: IRouter = Router();
router.use(requireAdmin);

const TZ = "Europe/Istanbul";

function adminSafe(
  label: string,
  handler: (req: Request, res: Response) => Promise<void>,
  empty: (res: Response) => void,
) {
  return async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(`[admin ${label}]`, err);
      empty(res);
    }
  };
}

function mapUser(u: LocalUser) {
  const role = normalizeRole(u.role, u.isAdmin);
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    province: u.province ?? null,
    district: u.district ?? null,
    institutionName: u.institutionName ?? null,
    institutionId: u.institutionId ?? null,
    institutionCode: u.institutionCode ?? null,
    role,
    isActive: u.isActive,
    isAdmin: role === "admin",
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  };
}

function activityStatus(lastLoginAt: Date | null): "today" | "week" | "inactive" | "never" {
  if (!lastLoginAt) return "never";
  const now = Date.now();
  const diff = now - lastLoginAt.getTime();
  const dayMs = 86400000;
  if (diff < dayMs) return "today";
  if (diff < 7 * dayMs) return "week";
  return "inactive";
}

router.get("/admin/overview", async (_req: Request, res: Response) => {
  try {
    const overview = await db.execute(sql`
      SELECT
        (SELECT COUNT(*)::int FROM local_users) AS total_users,
        (SELECT COUNT(*)::int FROM local_users
          WHERE last_login_at IS NOT NULL
            AND (last_login_at AT TIME ZONE 'Europe/Istanbul')::date = (NOW() AT TIME ZONE 'Europe/Istanbul')::date
        ) AS today_logins,
        (SELECT COUNT(*)::int FROM local_users
          WHERE last_login_at >= NOW() - INTERVAL '7 days'
        ) AS active_users_7d,
        (SELECT COUNT(*)::int FROM support_requests) AS total_support,
        (SELECT COUNT(DISTINCT institution_code)::int FROM local_users
          WHERE institution_code IS NOT NULL AND institution_code != ''
            AND last_login_at >= NOW() - INTERVAL '7 days'
        ) AS active_institutions,
        (SELECT COUNT(*)::int FROM (
          SELECT institution_code FROM local_users
          WHERE institution_code IS NOT NULL AND institution_code != ''
          GROUP BY institution_code
          HAVING MAX(last_login_at) IS NULL OR MAX(last_login_at) < NOW() - INTERVAL '7 days'
        ) t) AS passive_institutions
    `);

    const dailyLogins = await db.execute(sql`
      SELECT TO_CHAR((last_login_at AT TIME ZONE 'Europe/Istanbul')::date, 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS count
      FROM local_users
      WHERE last_login_at >= NOW() - INTERVAL '7 days'
      GROUP BY (last_login_at AT TIME ZONE 'Europe/Istanbul')::date
      ORDER BY day
    `);

    const districtActivity = await db.execute(sql`
      SELECT district, province, COUNT(*)::int AS today_count
      FROM local_users
      WHERE district IS NOT NULL AND district != ''
        AND last_login_at IS NOT NULL
        AND (last_login_at AT TIME ZONE 'Europe/Istanbul')::date = (NOW() AT TIME ZONE 'Europe/Istanbul')::date
      GROUP BY district, province
      ORDER BY today_count DESC
      LIMIT 10
    `);

    const recentLogins = await db.execute(sql`
      SELECT id, name, email, institution_name, district, province, role,
             TO_CHAR(last_login_at AT TIME ZONE 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI') AS last_login_at
      FROM local_users
      WHERE last_login_at IS NOT NULL
      ORDER BY last_login_at DESC
      LIMIT 8
    `);

    const row = (overview.rows[0] ?? {}) as Record<string, number>;
    res.json({
      totalUsers: row.total_users ?? 0,
      todayLogins: row.today_logins ?? 0,
      activeUsers7d: row.active_users_7d ?? 0,
      totalSupport: row.total_support ?? 0,
      activeInstitutions: row.active_institutions ?? 0,
      passiveInstitutions: row.passive_institutions ?? 0,
      totalPosters: 0,
      dailyLogins: dailyLogins.rows as { day: string; count: number }[],
      districtActivityToday: districtActivity.rows as {
        district: string;
        province: string;
        today_count: number;
      }[],
      recentLogins: recentLogins.rows,
    });
  } catch (err) {
    console.error("[admin overview]", err);
    res.status(500).json({ error: "Özet yüklenemedi" });
  }
});

router.get(
  "/admin/users",
  adminSafe(
    "users",
    async (req: Request, res: Response) => {
  const {
    province,
    district,
    institutionCode,
    role,
    active,
    search,
    todayLogin,
    neverLogin,
  } = req.query;

  const conditions = [];

  if (typeof province === "string" && province) {
    conditions.push(eq(localUsersTable.province, province));
  }
  if (typeof district === "string" && district) {
    conditions.push(eq(localUsersTable.district, district));
  }
  if (typeof institutionCode === "string" && institutionCode) {
    conditions.push(eq(localUsersTable.institutionCode, institutionCode));
  }
  if (typeof role === "string" && role === "admin") {
    conditions.push(
      or(eq(localUsersTable.isAdmin, true), eq(localUsersTable.role, "admin"))!,
    );
  } else if (typeof role === "string" && role === "user") {
    conditions.push(eq(localUsersTable.isAdmin, false));
  }
  if (active === "true") conditions.push(eq(localUsersTable.isActive, true));
  if (active === "false") conditions.push(eq(localUsersTable.isActive, false));
  if (search && typeof search === "string") {
    const q = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(localUsersTable.name, q),
        ilike(localUsersTable.email, q),
        ilike(localUsersTable.institutionName, q),
      )!,
    );
  }
  if (todayLogin === "true") {
    conditions.push(
      sql`(${localUsersTable.lastLoginAt} AT TIME ZONE 'Europe/Istanbul')::date = (NOW() AT TIME ZONE 'Europe/Istanbul')::date`,
    );
  }
  if (neverLogin === "true") {
    conditions.push(isNull(localUsersTable.lastLoginAt));
  }

  const users = await db
    .select()
    .from(localUsersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(localUsersTable.createdAt));

  res.json({
    ok: true,
    users: users.map((u) => ({
      ...mapUser(u),
      activityStatus: activityStatus(u.lastLoginAt),
    })),
  });
    },
    (res) => res.status(200).json({ ok: true, users: [] }),
  ),
);

router.post("/admin/users", async (req: Request, res: Response) => {
  const {
    email,
    password,
    name,
    province,
    district,
    institutionName,
    institutionCode,
    role,
    isActive,
    isAdmin,
  } = req.body;

  if (!name || !String(name).trim()) {
    res.status(400).json({ error: "Ad soyad zorunludur." });
    return;
  }
  if (!district || !institutionName) {
    res.status(400).json({ error: "Mıntıka ve kurum adı zorunludur." });
    return;
  }

  const pwd = password ? String(password) : sifreFromMintika(String(district));
  if (pwd.length < 6) {
    res.status(400).json({ error: "Şifre en az 6 karakter olmalıdır." });
    return;
  }

  const normalizedEmail = String(email || "").toLowerCase().trim();
  if (!normalizedEmail) {
    res.status(400).json({ error: "E-posta zorunludur." });
    return;
  }
  const existing = await db
    .select({ id: localUsersTable.id })
    .from(localUsersTable)
    .where(eq(localUsersTable.email, normalizedEmail));

  if (existing.length > 0) {
    res.status(409).json({ error: "Bu e-posta zaten kayıtlı." });
    return;
  }

  const districtNorm = normalizeDistrictName(String(district)) ?? String(district).trim();
  const inst = await resolveInstitution({
    district: districtNorm,
    institutionName: String(institutionName).trim(),
    institutionCode: institutionCode?.trim() || undefined,
    province: province?.trim() || null,
  });

  if (!inst) {
    res.status(400).json({ error: "Kurum kaydı oluşturulamadı. Mıntıka ve kurum adını kontrol edin." });
    return;
  }

  const normRole = normalizeRole(role, isAdmin);
  const passwordHash = await bcrypt.hash(pwd, 12);
  const [user] = await db
    .insert(localUsersTable)
    .values({
      email: normalizedEmail,
      passwordHash,
      name: String(name).trim(),
      province: inst.province,
      district: inst.districtName,
      institutionName: inst.institutionName,
      institutionCode: inst.institutionCode,
      institutionId: inst.id,
      role: normRole,
      isActive: isActive !== false,
      isAdmin: normRole === "admin",
    })
    .returning();

  res.json({ user: mapUser(user) });
});

router.patch("/admin/users/:id", async (req: Request, res: Response) => {
  const id = String(
    Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
  );
  const body = req.body as Record<string, unknown>;

  const [existing] = await db
    .select()
    .from(localUsersTable)
    .where(eq(localUsersTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Kullanıcı bulunamadı." });
    return;
  }

  const updates: Partial<typeof localUsersTable.$inferInsert> = {};
  if (body.name != null) updates.name = String(body.name).trim();
  if (body.email != null) updates.email = String(body.email).toLowerCase().trim();
  if (body.province != null) updates.province = String(body.province).trim() || null;
  if (body.district != null) updates.district = String(body.district).trim() || null;
  if (body.institutionName != null) {
    updates.institutionName = String(body.institutionName).trim() || null;
  }
  if (body.institutionCode != null) {
    updates.institutionCode = String(body.institutionCode).trim() || null;
  }
  if (body.district != null || body.institutionName != null || body.institutionCode != null) {
    const district = String(body.district ?? existing.district ?? "").trim();
    const institutionName = String(body.institutionName ?? existing.institutionName ?? "").trim();
    if (district && institutionName) {
      const inst = await resolveInstitution({
        district,
        institutionName,
        institutionCode: String(body.institutionCode ?? existing.institutionCode ?? ""),
        province: String(body.province ?? existing.province ?? ""),
      });
      if (inst) {
        updates.institutionId = inst.id;
        updates.institutionCode = inst.institutionCode;
        updates.institutionName = inst.institutionName;
        updates.district = inst.districtName;
        updates.province = inst.province;
      }
    }
  }
  if (body.role != null || body.isAdmin != null) {
    const normRole = normalizeRole(
      body.role != null ? String(body.role) : existing.role,
      body.isAdmin != null ? Boolean(body.isAdmin) : existing.isAdmin,
    );
    updates.role = normRole;
    updates.isAdmin = normRole === "admin";
  }
  if (body.isActive != null) updates.isActive = Boolean(body.isActive);

  const [user] = await db
    .update(localUsersTable)
    .set(updates)
    .where(eq(localUsersTable.id, id))
    .returning();

  res.json({ user: mapUser(user) });
});

router.post("/admin/users/:id/reset-password", async (req: Request, res: Response) => {
  const id = String(
    Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
  );
  const { password, generate } = req.body;

  const [existing] = await db
    .select()
    .from(localUsersTable)
    .where(eq(localUsersTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Kullanıcı bulunamadı." });
    return;
  }

  const pwd =
    generate || !password
      ? sifreFromMintika(existing.district || "")
      : String(password);

  if (pwd.length < 6) {
    res.status(400).json({ error: "Yeni şifre en az 6 karakter olmalıdır." });
    return;
  }

  const passwordHash = await bcrypt.hash(pwd, 12);
  await db
    .update(localUsersTable)
    .set({ passwordHash })
    .where(eq(localUsersTable.id, id));

  res.json({ ok: true, password: pwd });
});

router.get(
  "/admin/today-logins",
  adminSafe(
    "today-logins",
    async (req: Request, res: Response) => {
  const { province, district, institutionCode } = req.query;
  const conditions = [
    isNotNull(localUsersTable.lastLoginAt),
    sql`(${localUsersTable.lastLoginAt} AT TIME ZONE 'Europe/Istanbul')::date = (NOW() AT TIME ZONE 'Europe/Istanbul')::date`,
  ];
  if (typeof province === "string" && province) {
    conditions.push(eq(localUsersTable.province, province));
  }
  if (typeof district === "string" && district) {
    conditions.push(eq(localUsersTable.district, district));
  }
  if (typeof institutionCode === "string" && institutionCode) {
    conditions.push(eq(localUsersTable.institutionCode, institutionCode));
  }

  const users = await db
    .select()
    .from(localUsersTable)
    .where(and(...conditions))
    .orderBy(desc(localUsersTable.lastLoginAt));

  res.json({
    ok: true,
    count: users.length,
    logins: users.map((u) => ({
      ...mapUser(u),
      login_time: u.lastLoginAt
        ? u.lastLoginAt.toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: TZ,
          })
        : null,
    })),
  });
    },
    (res) => res.status(200).json({ ok: true, count: 0, logins: [] }),
  ),
);

router.get(
  "/admin/institutions",
  adminSafe(
    "institutions",
    async (req: Request, res: Response) => {
  const { province, district } = req.query;
  const users = await db.select().from(localUsersTable);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  type InstAgg = {
    institution_code: string;
    institution_name: string | null;
    province: string | null;
    district: string | null;
    user_count: number;
    today_active: number;
    active_7d: number;
    last_login_at: Date | null;
  };

  const map = new Map<string, InstAgg>();

  for (const u of users) {
    if (!u.institutionCode) continue;
    if (province && u.province !== province) continue;
    if (district && u.district !== district) continue;

    let agg = map.get(u.institutionCode);
    if (!agg) {
      agg = {
        institution_code: u.institutionCode,
        institution_name: u.institutionName,
        province: u.province,
        district: u.district,
        user_count: 0,
        today_active: 0,
        active_7d: 0,
        last_login_at: null,
      };
      map.set(u.institutionCode, agg);
    }
    agg.user_count += 1;
    if (u.lastLoginAt) {
      const diff = Date.now() - u.lastLoginAt.getTime();
      if (diff < 86400000) agg.today_active += 1;
      if (diff < 7 * 86400000) agg.active_7d += 1;
      if (!agg.last_login_at || u.lastLoginAt > agg.last_login_at) {
        agg.last_login_at = u.lastLoginAt;
      }
    }
  }

  const institutions = [...map.values()]
    .map((i) => ({
      ...i,
      last_login_at: i.last_login_at?.toISOString() ?? null,
      status: i.active_7d > 0 ? "active" : "passive",
    }))
    .sort((a, b) => b.active_7d - a.active_7d || b.user_count - a.user_count);

  res.json({ ok: true, institutions });
    },
    (res) => res.status(200).json({ ok: true, institutions: [] }),
  ),
);

router.get(
  "/admin/usage-tracking",
  adminSafe(
    "usage-tracking",
    async (req: Request, res: Response) => {
  const type = (req.query.type as string) || "never";
  const { province, district } = req.query;

  let users: LocalUser[] = [];

  if (type === "never") {
    users = await db
      .select()
      .from(localUsersTable)
      .where(isNull(localUsersTable.lastLoginAt))
      .orderBy(desc(localUsersTable.createdAt));
  } else if (type === "inactive7") {
    users = await db
      .select()
      .from(localUsersTable)
      .where(
        and(
          isNotNull(localUsersTable.lastLoginAt),
          sql`${localUsersTable.lastLoginAt} < NOW() - INTERVAL '7 days'`,
        ),
      )
      .orderBy(localUsersTable.lastLoginAt);
  } else if (type === "inactive30") {
    users = await db
      .select()
      .from(localUsersTable)
      .where(
        and(
          isNotNull(localUsersTable.lastLoginAt),
          sql`${localUsersTable.lastLoginAt} < NOW() - INTERVAL '30 days'`,
        ),
      )
      .orderBy(localUsersTable.lastLoginAt);
  }

  if (province || district) {
    users = users.filter((u) => {
      if (province && u.province !== province) return false;
      if (district && u.district !== district) return false;
      return true;
    });
  }

  let inactiveInstitutions: unknown[] = [];
  if (type === "inactiveInstitutions") {
    const r = await db.execute(sql`
      SELECT institution_code, MAX(institution_name) AS institution_name,
             MAX(province) AS province, MAX(district) AS district,
             COUNT(*)::int AS user_count
      FROM local_users
      WHERE institution_code IS NOT NULL AND institution_code != ''
      GROUP BY institution_code
      HAVING MAX(last_login_at) IS NULL
         OR MAX(last_login_at) < NOW() - INTERVAL '7 days'
      ORDER BY user_count DESC
    `);
    inactiveInstitutions = r.rows;
  }

  res.json({
    ok: true,
    users: users.map((u) => ({
      ...mapUser(u),
      daysSinceLogin: u.lastLoginAt
        ? Math.floor((Date.now() - u.lastLoginAt.getTime()) / 86400000)
        : null,
      activityStatus: activityStatus(u.lastLoginAt),
    })),
    inactiveInstitutions,
  });
    },
    (res) =>
      res.status(200).json({ ok: true, users: [], inactiveInstitutions: [] }),
  ),
);

router.get(
  "/admin/region-report",
  adminSafe(
    "region-report",
    async (req: Request, res: Response) => {
  const range = (req.query.range as string) || "7d";
  const { province, district, institutionCode } = req.query;

  const conditions = [];
  if (typeof province === "string" && province) {
    conditions.push(eq(localUsersTable.province, province));
  }
  if (typeof district === "string" && district) {
    conditions.push(eq(localUsersTable.district, district));
  }
  if (typeof institutionCode === "string" && institutionCode) {
    conditions.push(eq(localUsersTable.institutionCode, institutionCode));
  }

  const users = await db
    .select()
    .from(localUsersTable)
    .where(conditions.length ? and(...conditions) : undefined);

  const inRange = (last: Date | null) => {
    if (!last) return false;
    const now = new Date();
    if (range === "today") {
      const d = new Date(last.toLocaleString("en-US", { timeZone: TZ }));
      const t = new Date(now.toLocaleString("en-US", { timeZone: TZ }));
      return (
        d.getFullYear() === t.getFullYear() &&
        d.getMonth() === t.getMonth() &&
        d.getDate() === t.getDate()
      );
    }
    const days = range === "30d" ? 30 : 7;
    return now.getTime() - last.getTime() < days * 86400000;
  };

  const mapped = users.map((u) => ({
    ...mapUser(u),
    activityStatus: activityStatus(u.lastLoginAt),
    activeInRange: inRange(u.lastLoginAt),
  }));

  const activeInstitutions = new Set(
    mapped
      .filter((u) => u.activeInRange && u.institutionCode)
      .map((u) => u.institutionCode),
  );

  res.json({
    ok: true,
    summary: {
      total_users: users.length,
      active_in_range: mapped.filter((u) => u.activeInRange).length,
      never_logged_in: mapped.filter((u) => u.activityStatus === "never").length,
      active_institutions: activeInstitutions.size,
    },
    users: mapped,
  });
    },
    (res) =>
      res.status(200).json({
        ok: true,
        summary: {
          total_users: 0,
          active_in_range: 0,
          never_logged_in: 0,
          active_institutions: 0,
        },
        users: [],
      }),
  ),
);

router.get(
  "/admin/support",
  adminSafe(
    "support",
    async (_req: Request, res: Response) => {
  const rows = await db.execute(sql`
    SELECT sr.id, sr.user_id, sr.user_email, sr.user_name, sr.message,
           sr.status, sr.admin_note, sr.created_at,
           lu.province, lu.district, lu.institution_name, lu.institution_code
    FROM support_requests sr
    LEFT JOIN local_users lu ON lu.id::text = sr.user_id
    ORDER BY sr.created_at DESC
  `);
  res.json({ ok: true, requests: rows.rows });
    },
    (res) => res.status(200).json({ ok: true, requests: [] }),
  ),
);

router.patch("/admin/support/:id", async (req: Request, res: Response) => {
  const id = Number(
    Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
  );
  const { status, adminNote } = req.body;
  await db
    .update(supportRequestsTable)
    .set({
      ...(status ? { status: String(status) } : {}),
      ...(adminNote !== undefined ? { adminNote: adminNote ? String(adminNote) : null } : {}),
    })
    .where(eq(supportRequestsTable.id, id));

  res.json({ ok: true });
});

router.get(
  "/admin/filters",
  adminSafe(
    "filters",
    async (_req: Request, res: Response) => {
  const provinces = await db.execute(sql`
    SELECT DISTINCT province FROM local_users
    WHERE province IS NOT NULL AND province != ''
    ORDER BY province
  `);
  const districts = await db.execute(sql`
    SELECT DISTINCT district, province FROM local_users
    WHERE district IS NOT NULL AND district != ''
    ORDER BY province, district
  `);
  const institutions = await db.execute(sql`
    SELECT DISTINCT institution_code, institution_name, district, province
    FROM local_users
    WHERE institution_code IS NOT NULL AND institution_code != ''
    ORDER BY institution_name
  `);

  res.json({
    ok: true,
    provinces: (provinces.rows as { province: string }[]).map((r) => r.province),
    districts: districts.rows,
    institutions: institutions.rows,
  });
    },
    (res) =>
      res.status(200).json({ ok: true, provinces: [], districts: [], institutions: [] }),
  ),
);

router.get("/admin/slug-suggest", (req: Request, res: Response) => {
  const district = String(req.query.district || "");
  const institutionName = String(req.query.institutionName || "");
  res.json({ code: kurumKoduOner(district, institutionName) });
});

export default router;
