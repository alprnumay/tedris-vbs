import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAdmin";
import { type CompatRecord, listCompatRecords } from "../lib/recordsCompat";
import {
  createCompatRecord,
  updateCompatRecord,
  deleteCompatRecord,
  RecordsMutationError,
  type MutationContext,
} from "../lib/recordsMutations";

const router: IRouter = Router();

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
    institution: body.institution ?? body.institutionName,
    group: body.group ?? body.groupName,
    parentPhone: body.parentPhone ?? "",
    isActive: body.isActive ?? body.active ?? true,
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
  return {
    id: String(record.id),
    name: String(data.name ?? ""),
    grade: String(data.grade ?? ""),
    institution: String(data.institution ?? ""),
    group: String(data.group ?? ""),
    parentPhone: String(data.parentPhone ?? ""),
    isActive: data.isActive !== false,
    ownerUserId: record.userId != null ? String(record.userId) : data.ownerUserId ?? null,
    createdAt: record.createdAt ?? record.created_at,
    updatedAt: record.updatedAt ?? record.updated_at,
  };
}

function recordToDaily(record: CompatRecord) {
  const data = record.data ?? {};
  return {
    id: String(record.id),
    studentId: String(data.studentId ?? ""),
    date: String(data.date ?? ""),
    institution: String(data.institution ?? ""),
    group: String(data.group ?? ""),
    attendanceStatus: data.attendanceStatus ?? null,
    homeworkStatus: data.homeworkStatus ?? null,
    note: String(data.note ?? ""),
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
  res.json({ ok: true, feature: "okul_takip", studentRecordType: "okul_student" });
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

export default router;
