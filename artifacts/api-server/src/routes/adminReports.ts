import { Router, type IRouter, type Request, type Response } from "express";
import { db, institutionsTable, localUsersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin, requireReportAccess } from "../middlewares/requireAdmin";
import { TRACKED_DISTRICTS } from "../lib/trackedDistricts";
import { resolveDateRange } from "../lib/adminDateRange";
import { loadPeriodSettings, savePeriodSettings } from "../lib/adminSettingsStore";
import {
  loadAdminMetricsContext,
  buildDataHealthIssues,
  loadActivityLogs,
} from "../lib/adminMetrics";
import { kurumKoduOner } from "../lib/institutionSlug";
import { normalizeDistrictName } from "../lib/trackedDistricts";
import { reconcileUsersWithInstitutions, resolveInstitution, linkUserToInstitution } from "../lib/institutionRegistry";
import {
  filterMintikaMetrics,
  filterYurtsByAccess,
  isDistrictAllowed,
  resolveDistrictFilter,
  type ReportAccess,
} from "../lib/reportAccess";

const router: IRouter = Router();

type ReportRequest = Request & { reportAccess?: ReportAccess };

function reportAccess(req: Request): ReportAccess {
  return (req as ReportRequest).reportAccess ?? { type: "own", mintikas: [] };
}

async function getRange(req: Request) {
  const settings = await loadPeriodSettings();
  return resolveDateRange(String(req.query.range || "7d"), {
    customStart: typeof req.query.from === "string" ? req.query.from : undefined,
    customEnd: typeof req.query.to === "string" ? req.query.to : undefined,
    settings,
  });
}

router.post("/admin/reconcile", requireAdmin, async (_req, res) => {
  try {
    const result = await reconcileUsersWithInstitutions();
    res.json(result);
  } catch (err) {
    console.error("[admin reconcile]", err);
    res.status(500).json({ error: "Eşleştirme tamamlanamadı" });
  }
});

router.get("/admin/tracked-districts", requireReportAccess, (req, res) => {
  const access = reportAccess(req);
  if (access.type === "mintika") {
    res.json({ districts: access.mintikas });
    return;
  }
  res.json({ districts: TRACKED_DISTRICTS });
});

router.get("/admin/mintikas", requireAdmin, async (_req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT DISTINCT district_name AS district
      FROM institutions
      WHERE district_name IS NOT NULL AND trim(district_name) <> ''
      UNION
      SELECT DISTINCT district_name AS district
      FROM local_users
      WHERE district_name IS NOT NULL AND trim(district_name) <> '' AND deleted_at IS NULL
    `);
    const raw = ((rows as { rows?: { district?: string }[] }).rows ?? [])
      .map((row) => normalizeDistrictName(row.district) ?? String(row.district ?? "").trim())
      .filter(Boolean);
    const seen = new Set<string>();
    const mintikas: string[] = [];
    for (const name of raw) {
      const key = name.toLocaleLowerCase("tr-TR");
      if (seen.has(key)) continue;
      seen.add(key);
      mintikas.push(name);
    }
    mintikas.sort((a, b) => a.localeCompare(b, "tr"));
    res.json(mintikas);
  } catch (err) {
    console.error("[admin mintikas]", err);
    res.status(500).json({ error: "Mıntıka listesi yüklenemedi" });
  }
});

router.get("/admin/settings", requireAdmin, async (_req, res) => {
  const settings = await loadPeriodSettings();
  res.json({ settings });
});

router.patch("/admin/settings", requireAdmin, async (req, res) => {
  const { periodStart, periodEnd, seasonStart, seasonEnd } = req.body;
  await savePeriodSettings({
    periodStart,
    periodEnd,
    seasonStart,
    seasonEnd,
  });
  res.json({ ok: true, settings: await loadPeriodSettings() });
});

router.get("/admin/dashboard", requireReportAccess, async (req, res) => {
  try {
    const access = reportAccess(req);
    const range = await getRange(req);
    const requestedDistrict =
      typeof req.query.district === "string" ? req.query.district : null;
    const district = resolveDistrictFilter(access, requestedDistrict);
    if (district === undefined) {
      res.status(403).json({ error: "Bu mıntıka için rapor erişiminiz yok." });
      return;
    }
    const institutionCode =
      typeof req.query.institutionCode === "string" ? req.query.institutionCode : undefined;

    const ctx = await loadAdminMetricsContext(range);
    let yurts = filterYurtsByAccess(access, ctx.yurts, district);
    if (institutionCode) yurts = yurts.filter((y) => y.institutionCode === institutionCode);

    const mintikaSummary = filterMintikaMetrics(access, ctx.mintikalar);

    const todayActiveYurts = yurts.filter((y) => y.todayLoginUsers > 0).length;
    const active7dYurts = yurts.filter(
      (y) =>
        y.activityStatus === "bugun_aktif" ||
        y.activityStatus === "son_7_gun_aktif" ||
        y.logins7d > 0,
    ).length;
    const passive7d = yurts.filter(
      (y) => y.activityStatus === "pasif_7" || y.activityStatus === "pasif_30",
    ).length;
    const neverYurts = yurts.filter((y) => y.activityStatus === "hic_giris_yok").length;
    const openSupport = yurts.reduce((s, y) => s + y.openSupport, 0);
    const dataIssues = buildDataHealthIssues(ctx).length;

    const attention = yurts
      .filter(
        (y) =>
          y.activityStatus === "pasif_7" ||
          y.activityStatus === "pasif_30" ||
          y.activityStatus === "hic_giris_yok" ||
          y.openSupport > 0,
      )
      .slice(0, 20);

    res.json({
      range,
      hasActivityLogs: ctx.hasActivityLogs,
      activityWarning: ctx.hasActivityLogs
        ? undefined
        : "Geçmiş trend için aktivite kaydı gereklidir. Şu an son giriş tarihleri kullanılıyor.",
      summary: {
        totalDistricts:
          access.type === "mintika"
            ? access.mintikas.length
            : TRACKED_DISTRICTS.length,
        totalYurts: yurts.length,
        totalUsers: yurts.reduce((s, y) => s + y.userCount, 0),
        todayActiveYurts,
        todayActiveUsers: yurts.reduce((s, y) => s + y.todayLoginUsers, 0),
        active7dYurts,
        passive7dYurts: passive7d,
        neverLoginYurts: neverYurts,
        openSupport,
        dataIssueCount: dataIssues,
        unmatchedUsers: ctx.unmatchedUsers.length,
      },
      mintikaSummary,
      reportAccess: access,
      attentionYurts: attention,
      dataQualityWarning:
        dataIssues > 0
          ? `Bu raporda ${dataIssues} veri sorunu tespit edildi. Sonuçların tam doğru olması için Veri Sağlığı ekranını kontrol edin.`
          : "Veriler sağlıklı görünüyor.",
    });
  } catch (err) {
    console.error("[admin dashboard]", err);
    res.status(500).json({ error: "Panel verisi yüklenemedi" });
  }
});

router.get("/admin/mintika-board", requireReportAccess, async (req, res) => {
  try {
    const access = reportAccess(req);
    const range = await getRange(req);
    const ctx = await loadAdminMetricsContext(range);
    res.json({
      range,
      hasActivityLogs: ctx.hasActivityLogs,
      reportAccess: access,
      mintikalar: filterMintikaMetrics(access, ctx.mintikalar).sort(
        (a, b) => (b.healthScore ?? 0) - (a.healthScore ?? 0),
      ),
    });
  } catch (err) {
    console.error("[admin mintika-board]", err);
    res.status(500).json({ error: "Mıntıka panosu yüklenemedi" });
  }
});

router.get("/admin/yurt-tracking", requireReportAccess, async (req, res) => {
  try {
    const access = reportAccess(req);
    const range = await getRange(req);
    const ctx = await loadAdminMetricsContext(range);
    const requestedDistrict =
      typeof req.query.district === "string" ? req.query.district : null;
    const district = resolveDistrictFilter(access, requestedDistrict);
    if (district === undefined) {
      res.status(403).json({ error: "Bu mıntıka için rapor erişiminiz yok." });
      return;
    }
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const hasSupport = req.query.hasSupport === "true";
    const noUsers = req.query.noUsers === "true";
    const dataGap = req.query.dataGap === "true";

    let list = filterYurtsByAccess(access, ctx.yurts, district);
    if (status) list = list.filter((y) => y.activityStatus === status);
    if (hasSupport) list = list.filter((y) => y.openSupport > 0);
    if (noUsers) list = list.filter((y) => y.userCount === 0);
    if (dataGap) list = list.filter((y) => y.hasDataGap);

    const preset = typeof req.query.preset === "string" ? req.query.preset : "";
    if (preset === "today_active") list = list.filter((y) => y.activityStatus === "bugun_aktif");
    if (preset === "week_active") {
      list = list.filter(
        (y) => y.activityStatus === "bugun_aktif" || y.activityStatus === "son_7_gun_aktif",
      );
    }
    if (preset === "passive7") list = list.filter((y) => y.activityStatus === "pasif_7");
    if (preset === "passive30") list = list.filter((y) => y.activityStatus === "pasif_30");
    if (preset === "never") list = list.filter((y) => y.activityStatus === "hic_giris_yok");

    res.json({
      range,
      hasActivityLogs: ctx.hasActivityLogs,
      yurts: list,
      total: list.length,
    });
  } catch (err) {
    console.error("[admin yurt-tracking]", err);
    res.status(500).json({ error: "Yurt takibi yüklenemedi" });
  }
});

router.get("/admin/data-health", requireAdmin, async (_req, res) => {
  try {
    const range = resolveDateRange("7d");
    const ctx = await loadAdminMetricsContext(range);
    const issues = buildDataHealthIssues(ctx);
    const totalChecks = ctx.yurts.length + ctx.allUsers.length;
    const score =
      totalChecks > 0
        ? Math.max(0, Math.round(100 - (issues.length / Math.max(1, totalChecks)) * 100))
        : null;

    res.json({
      score,
      issueCount: issues.length,
      issues,
      unmatchedUsers: ctx.unmatchedUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        institutionCode: u.institutionCode,
        institutionName: u.institutionName,
        district: u.district,
      })),
    });
  } catch (err) {
    console.error("[admin data-health]", err);
    res.status(500).json({ error: "Veri sağlığı yüklenemedi" });
  }
});

router.post("/admin/data-health/actions", requireAdmin, async (req, res) => {
  const action = String(req.body?.action || "");
  const userIds = Array.isArray(req.body?.userIds) ? req.body.userIds.map(String) : [];
  const issueIds = Array.isArray(req.body?.issueIds) ? req.body.issueIds.map(String) : [];
  const district = typeof req.body?.district === "string" ? req.body.district : "";
  const institutionName = typeof req.body?.institutionName === "string" ? req.body.institutionName : "";
  const institutionCode = typeof req.body?.institutionCode === "string" ? req.body.institutionCode : "";

  if (!["match", "deactivate", "ignore"].includes(action)) {
    res.status(400).json({ error: "Geçersiz işlem." });
    return;
  }

  let affected = 0;
  if (action === "match") {
    if (!district || !institutionName) {
      res.status(400).json({ error: "Eşleştirme için mıntıka ve kurum zorunludur." });
      return;
    }
    const inst = await resolveInstitution({ district, institutionName, institutionCode });
    if (!inst) {
      res.status(400).json({ error: "Kurum eşleştirilemedi." });
      return;
    }
    for (const userId of userIds) {
      await linkUserToInstitution(userId, inst);
      affected += 1;
    }
  }

  if (action === "deactivate") {
    for (const userId of userIds) {
      await db
        .update(localUsersTable)
        .set({ isActive: false, deletedAt: new Date() })
        .where(eq(localUsersTable.id, userId));
      affected += 1;
    }
  }

  if (action === "ignore") {
    // Kalıcı yoksayma için ayrı tablo yok; UI seçimi temizleyebilmek için başarılı yanıt döner.
    affected = issueIds.length || userIds.length;
  }

  res.json({ ok: true, affected });
});

router.get("/admin/activity-logs", requireReportAccess, async (req, res) => {
  try {
    const access = reportAccess(req);
    const range = await getRange(req);
    const ctx = await loadAdminMetricsContext(range);
    const requestedDistrict =
      typeof req.query.district === "string" ? req.query.district : undefined;
    const districtFilter = resolveDistrictFilter(access, requestedDistrict);
    if (districtFilter === undefined) {
      res.status(403).json({ error: "Bu mıntıka için rapor erişiminiz yok." });
      return;
    }

    if (!ctx.hasActivityLogs) {
      res.json({
        range,
        hasActivityLogs: false,
        warning: "Geçmiş trend için aktivite kaydı gereklidir.",
        logs: [],
        summary: {
          loginCount: 0,
          activeYurts: 0,
          activeUsers: 0,
          exportPng: 0,
          exportPdf: 0,
          shareWhatsapp: 0,
          supportCreated: 0,
        },
      });
      return;
    }

    const logs = await loadActivityLogs({
      startIso: range.startIso,
      endIso: range.endIso,
      district: districtFilter ?? undefined,
      institutionCode:
        typeof req.query.institutionCode === "string" ? req.query.institutionCode : undefined,
      action: typeof req.query.action === "string" ? req.query.action : undefined,
    });

    const userMap = new Map(ctx.allUsers.map((u) => [u.id, u]));
    const enriched = logs
      .map((l) => {
        const u = l.userId ? userMap.get(l.userId) : undefined;
        return {
          id: l.id,
          createdAt: l.createdAt.toISOString(),
          action: l.action,
          userId: l.userId,
          userName: u?.name ?? null,
          institutionCode: l.institutionCode,
          institutionName: u?.institutionName ?? null,
          district: l.district,
          province: l.province,
          metadata: l.metadata,
        };
      })
      .filter((row) => isDistrictAllowed(access, row.district));

    const countAction = (a: string) => enriched.filter((x) => x.action === a).length;
    const loginUsers = new Set(enriched.filter((x) => x.action === "login").map((x) => x.userId));
    const loginCodes = new Set(
      enriched.filter((x) => x.action === "login" && x.institutionCode).map((x) => x.institutionCode),
    );

    res.json({
      range,
      hasActivityLogs: true,
      logs: enriched,
      summary: {
        loginCount: countAction("login"),
        activeYurts: loginCodes.size,
        activeUsers: loginUsers.size,
        exportPng: countAction("export_png"),
        exportPdf: countAction("export_pdf"),
        shareWhatsapp: countAction("share_whatsapp"),
        supportCreated: countAction("support_created"),
      },
    });
  } catch (err) {
    console.error("[admin activity-logs]", err);
    res.status(500).json({ error: "Aktivite kayıtları yüklenemedi" });
  }
});

router.get("/admin/institutions-registry", requireReportAccess, async (req, res) => {
  const access = reportAccess(req);
  const requestedDistrict =
    typeof req.query.district === "string" ? req.query.district : null;
  const district = resolveDistrictFilter(access, requestedDistrict);
  if (district === undefined) {
    res.status(403).json({ error: "Bu mıntıka için rapor erişiminiz yok." });
    return;
  }
  let rows = await db.select().from(institutionsTable);
  if (access.type === "mintika") {
    rows = rows.filter((r) => isDistrictAllowed(access, r.districtName));
  }
  if (district) rows = rows.filter((r) => normalizeDistrictName(r.districtName) === district);
  res.json({
    institutions: rows.map((r) => ({
      id: r.id,
      institutionName: r.institutionName,
      institutionCode: r.institutionCode,
      districtName: r.districtName,
      province: r.province,
      expectedUserCount: r.expectedUserCount,
      status: r.status,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
});

router.post("/admin/institutions-registry", requireAdmin, async (req, res) => {
  const { institutionName, districtName, province, institutionCode, expectedUserCount, status, notes } =
    req.body;
  if (!institutionName || !districtName) {
    res.status(400).json({ error: "Kurum adı ve mıntıka zorunludur." });
    return;
  }
  const dn = normalizeDistrictName(String(districtName)) ?? String(districtName).trim();
  const code =
    institutionCode?.trim() ||
    kurumKoduOner(dn, String(institutionName));

  const [row] = await db
    .insert(institutionsTable)
    .values({
      institutionName: String(institutionName).trim(),
      institutionCode: code,
      districtName: dn,
      province: province?.trim() || null,
      expectedUserCount: expectedUserCount ? Number(expectedUserCount) : null,
      status: status || "aktif",
      notes: notes?.trim() || null,
    })
    .returning();

  res.json({ institution: row });
});

router.patch("/admin/institutions-registry/:id", requireAdmin, async (req, res) => {
  const id = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof institutionsTable.$inferInsert> = { updatedAt: new Date() };
  if (body.institutionName != null) updates.institutionName = String(body.institutionName).trim();
  if (body.districtName != null) {
    updates.districtName =
      normalizeDistrictName(String(body.districtName)) ?? String(body.districtName).trim();
  }
  if (body.province != null) updates.province = String(body.province).trim() || null;
  if (body.status != null) updates.status = String(body.status);
  if (body.notes !== undefined) updates.notes = body.notes ? String(body.notes) : null;
  if (body.expectedUserCount != null) {
    updates.expectedUserCount = Number(body.expectedUserCount) || null;
  }

  const [row] = await db
    .update(institutionsTable)
    .set(updates)
    .where(eq(institutionsTable.id, id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Kayıt bulunamadı" });
    return;
  }
  res.json({ institution: row });
});

export default router;
