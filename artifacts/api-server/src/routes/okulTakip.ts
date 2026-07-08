import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth, requireAdmin, requireReportAccess } from "../middlewares/requireAdmin";
import { type CompatRecord, listCompatRecords } from "../lib/recordsCompat";
import {
  createCompatRecord,
  updateCompatRecord,
  deleteCompatRecord,
  RecordsMutationError,
  type MutationContext,
} from "../lib/recordsMutations";
import {
  buildOkulTakipInstitutionDetail,
  buildOkulTakipMissingReport,
  buildOkulTakipSummaryReport,
  todayIsoDate,
  validateReportDate,
} from "../lib/okulTakipReports";
import {
  getViewerInstitutionOptions,
  listUnmappedStudents,
  OkulTakipInstitutionError,
  remapStudentInstitution,
} from "../lib/okulTakipInstitutionResolver";
import { resolveDistrictFilter, type ReportAccess } from "../lib/reportAccess";

const router: IRouter = Router();

type ReportRequest = Request & { reportAccess?: ReportAccess };

function reportAccess(req: Request): ReportAccess {
  return (req as ReportRequest).reportAccess ?? { type: "own", mintikas: [] };
}

function parseReportQuery(req: Request, res: Response): { date: string; mintika: string | null } | null {
  const date = validateReportDate(String(req.query.date ?? todayIsoDate())) ?? todayIsoDate();
  const access = reportAccess(req);
  const requestedMintika =
    typeof req.query.mintika === "string"
      ? req.query.mintika
      : typeof req.query.district === "string"
        ? req.query.district
        : null;
  const mintika = resolveDistrictFilter(access, requestedMintika);
  if (mintika === undefined) {
    res.status(403).json({ error: "Bu mıntıka için rapor erişiminiz yok." });
    return null;
  }
  return { date, mintika };
}

function mutationContext(req: Request): MutationContext {
  return {
    viewerId: req.localUser?.id,
    admin: false,
  };
}

function requireViewer(req: Request, res: Response): string | null {
  const viewerId = req.localUser?.id;
  if (!viewerId) {
    res.status(401).json({ error: "Giriş yapmanız gerekiyor." });
    return null;
  }
  return viewerId;
}

function studentInput(body: Record<string, unknown>) {
  return {
    name: body.name,
    grade: body.grade ?? body.classLevel,
    institutionId: body.institutionId ?? null,
    group: body.group ?? body.groupName,
    parentPhone: body.parentPhone ?? "",
    isActive: body.isActive ?? body.active ?? true,
    studentCode: body.studentCode ?? "",
    nationalId: body.nationalId ?? "",
    rawImportData: body.rawImportData ?? null,
    importedAt: body.importedAt ?? null,
  };
}

function dailyInput(body: Record<string, unknown>) {
  return {
    studentId: body.studentId,
    date: body.date,
    institution: body.institution ?? body.institutionName,
    group: body.group ?? body.groupName,
    attendanceStatus: body.attendanceStatus ?? null,
    homeworkStatus: body.homeworkStatus ?? null,
    note: body.note ?? "",
  };
}

function recordToStudent(record: CompatRecord) {
  const data = record.data ?? {};
  const institutionName = String(data.institutionName ?? data.institution ?? "");
  return {
    id: String(record.id),
    name: String(data.name ?? ""),
    grade: String(data.grade ?? ""),
    institution: institutionName,
    institutionName,
    institutionId: data.institutionId != null ? String(data.institutionId) : null,
    mintikaName: String(data.mintikaName ?? ""),
    needsInstitutionMapping: data.needsInstitutionMapping === true,
    group: String(data.group ?? ""),
    parentPhone: String(data.parentPhone ?? ""),
    isActive: data.isActive !== false,
    studentCode: String(data.studentCode ?? ""),
    nationalId: String(data.nationalId ?? ""),
    rawImportData:
      data.rawImportData && typeof data.rawImportData === "object"
        ? data.rawImportData
        : null,
    importedAt: data.importedAt != null ? String(data.importedAt) : null,
    ownerUserId: record.userId != null ? String(record.userId) : data.ownerUserId ?? null,
    createdAt: record.createdAt ?? record.created_at,
    updatedAt: record.updatedAt ?? record.updated_at,
  };
}

function recordToDaily(record: CompatRecord) {
  const data = record.data ?? {};
  const institutionName = String(data.institutionName ?? data.institution ?? "");
  return {
    id: String(record.id),
    studentId: String(data.studentId ?? ""),
    date: String(data.date ?? ""),
    institution: institutionName,
    institutionName,
    institutionId: data.institutionId != null ? String(data.institutionId) : null,
    group: String(data.group ?? ""),
    mintikaName: String(data.mintikaName ?? ""),
    attendanceStatus: data.attendanceStatus ?? null,
    homeworkStatus: data.homeworkStatus ?? null,
    note: String(data.note ?? ""),
    completedByUserId: data.completedByUserId ?? null,
    createdAt: record.createdAt ?? record.created_at,
    updatedAt: record.updatedAt ?? record.updated_at,
  };
}

function sendError(res: Response, err: unknown, logLabel: string) {
  console.error(`[okul-takip] ${logLabel}`, err);
  if (err instanceof RecordsMutationError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "Okul takip işlemi başarısız." });
}

router.get("/okul-takip/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    feature: "okul_takip",
    studentRecordType: "okul_student",
    reportsEnabled: true,
    institutionBinding: true,
  });
});

router.get("/okul-takip/my-institutions", requireAuth, async (req: Request, res: Response) => {
  if (!requireViewer(req, res)) return;
  try {
    const institutions = await getViewerInstitutionOptions(mutationContext(req));
    const defaultInstitution = institutions.find((institution) => institution.isDefault) ?? institutions[0] ?? null;
    res.json({
      institutions,
      defaultInstitutionId: defaultInstitution?.id ?? null,
      needsInstitutionMapping: institutions.length === 0,
      ...(institutions.length === 0
        ? { message: "Kullanıcının bağlı olduğu yurt/kurum bulunamadı." }
        : {}),
    });
  } catch (err) {
    sendError(res, err, "my-institutions failed");
  }
});

router.get("/okul-takip/unmapped-students", requireReportAccess, async (_req: Request, res: Response) => {
  try {
    const students = await listUnmappedStudents();
    res.json({ students });
  } catch (err) {
    sendError(res, err, "unmapped students failed");
  }
});

router.post("/okul-takip/remap-student", requireAdmin, async (req: Request, res: Response) => {
  const studentId = String((req.body as { studentId?: unknown }).studentId ?? "");
  const institutionId = String((req.body as { institutionId?: unknown }).institutionId ?? "");
  if (!studentId || !institutionId) {
    res.status(400).json({ error: "Öğrenci ve kurum kimliği gerekli." });
    return;
  }
  try {
    const result = await remapStudentInstitution(studentId, institutionId);
    res.json(result);
  } catch (err) {
    if (err instanceof OkulTakipInstitutionError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    sendError(res, err, "remap student failed");
  }
});

router.get("/okul-takip/students", requireAuth, async (req: Request, res: Response) => {
  const viewerId = requireViewer(req, res);
  if (!viewerId) return;

  try {
    const { records } = await listCompatRecords("okul_student", {
      limit: 10000,
      offset: 0,
      viewerId,
      viewerEmail: req.localUser?.email,
      admin: false,
      reportAccess: { type: "own", mintikas: [] },
    });
    res.json({ students: records.map(recordToStudent) });
  } catch (err) {
    sendError(res, err, "list students failed");
  }
});

router.post("/okul-takip/students", requireAuth, async (req: Request, res: Response) => {
  if (!requireViewer(req, res)) return;

  try {
    const record = await createCompatRecord(
      "okul_student",
      studentInput((req.body ?? {}) as Record<string, unknown>),
      mutationContext(req),
    );
    res.status(201).json({ student: recordToStudent(record) });
  } catch (err) {
    sendError(res, err, "create student failed");
  }
});

router.patch("/okul-takip/students/:id", requireAuth, async (req: Request, res: Response) => {
  if (!requireViewer(req, res)) return;

  const id = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  try {
    const record = await updateCompatRecord(
      "okul_student",
      id,
      studentInput((req.body ?? {}) as Record<string, unknown>),
      mutationContext(req),
    );
    res.json({ student: recordToStudent(record) });
  } catch (err) {
    sendError(res, err, "update student failed");
  }
});

router.delete("/okul-takip/students/:id", requireAuth, async (req: Request, res: Response) => {
  if (!requireViewer(req, res)) return;

  const id = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  try {
    await deleteCompatRecord(id, mutationContext(req), "okul_student");
    res.json({ ok: true });
  } catch (err) {
    sendError(res, err, "delete student failed");
  }
});

router.get("/okul-takip/daily-records", requireAuth, async (req: Request, res: Response) => {
  const viewerId = requireViewer(req, res);
  if (!viewerId) return;

  try {
    const { records } = await listCompatRecords("okul_daily_record", {
      limit: 10000,
      offset: 0,
      viewerId,
      viewerEmail: req.localUser?.email,
      admin: false,
      reportAccess: { type: "own", mintikas: [] },
    });
    res.json({ records: records.map(recordToDaily) });
  } catch (err) {
    sendError(res, err, "list daily records failed");
  }
});

router.put("/okul-takip/daily-records", requireAuth, async (req: Request, res: Response) => {
  if (!requireViewer(req, res)) return;

  const items = Array.isArray((req.body as { records?: unknown }).records)
    ? ((req.body as { records: Record<string, unknown>[] }).records ?? [])
    : [];

  try {
    const ctx = mutationContext(req);
    const saved: CompatRecord[] = [];
    for (const item of items) {
      const data = dailyInput(item);
      const id = item.id != null ? String(item.id) : "";
      const isUuid = /^[0-9a-f-]{36}$/i.test(id);
      const record = isUuid
        ? await updateCompatRecord("okul_daily_record", id, data, ctx)
        : await createCompatRecord("okul_daily_record", data, ctx);
      saved.push(record);
    }
    res.json({ records: saved.map(recordToDaily) });
  } catch (err) {
    sendError(res, err, "upsert daily records failed");
  }
});

router.get("/okul-takip/reports/summary", requireReportAccess, async (req: Request, res: Response) => {
  const parsed = parseReportQuery(req, res);
  if (!parsed) return;

  try {
    const report = await buildOkulTakipSummaryReport(parsed.date, reportAccess(req), parsed.mintika);
    res.json(report);
  } catch (err) {
    sendError(res, err, "summary report failed");
  }
});

router.get("/okul-takip/reports/missing", requireReportAccess, async (req: Request, res: Response) => {
  const parsed = parseReportQuery(req, res);
  if (!parsed) return;

  try {
    const report = await buildOkulTakipMissingReport(parsed.date, reportAccess(req), parsed.mintika);
    res.json(report);
  } catch (err) {
    sendError(res, err, "missing report failed");
  }
});

router.get(
  "/okul-takip/reports/institution/:institutionName",
  requireReportAccess,
  async (req: Request, res: Response) => {
    const parsed = parseReportQuery(req, res);
    if (!parsed) return;

    const institutionName = String(
      Array.isArray(req.params.institutionName)
        ? req.params.institutionName[0]
        : req.params.institutionName,
    );

    try {
      const detail = await buildOkulTakipInstitutionDetail(
        parsed.date,
        institutionName,
        reportAccess(req),
        parsed.mintika,
      );
      if (!detail) {
        res.status(403).json({ error: "Bu kurum için rapor erişiminiz yok." });
        return;
      }
      res.json(detail);
    } catch (err) {
      sendError(res, err, "institution report failed");
    }
  },
);

export default router;
