import { Router, type IRouter, type Request, type Response } from "express";
import { requireAuth, requireAdmin, isRequestAdmin } from "../middlewares/requireAdmin";
import {
  RECORD_TYPES,
  findCompatRecordById,
  getCompatRecord,
  listCompatRecords,
  parseListQuery,
  recordsListResponse,
} from "../lib/recordsCompat";
import {
  createCompatRecord,
  updateCompatRecord,
  deleteCompatRecord,
  RecordsMutationError,
} from "../lib/recordsMutations";

const router: IRouter = Router();

function mutationContext(req: Request, forceAdmin: boolean) {
  return {
    viewerId: req.localUser?.id,
    admin: forceAdmin || isRequestAdmin(req),
  };
}

function parseMutationBody(req: Request) {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const recordType = String(body.record_type ?? body.recordType ?? req.query.record_type ?? "").trim();
  const data =
    body.data && typeof body.data === "object" && !Array.isArray(body.data)
      ? (body.data as Record<string, unknown>)
      : body;
  return { recordType, data };
}

function sendMutationError(res: Response, err: unknown) {
  if (err instanceof RecordsMutationError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error("[records] mutation failed:", err);
  res.status(500).json({ error: "Kayıt işlemi başarısız." });
}

async function handleRecordsList(req: Request, res: Response, forceAdmin: boolean) {
  const { recordType, limit, offset } = parseListQuery(req.query as Record<string, unknown>);

  if (!recordType || !RECORD_TYPES.has(recordType)) {
    res.json(recordsListResponse([], 0, offset));
    return;
  }

  const admin = forceAdmin || isRequestAdmin(req);
  const viewerId = req.localUser?.id;
  const viewerEmail = req.localUser?.email;

  try {
    const { records, total } = await listCompatRecords(recordType, {
      limit,
      offset,
      viewerId,
      viewerEmail,
      admin,
    });
    res.json(recordsListResponse(records, total, offset));
  } catch (err) {
    console.error("[records] list failed:", recordType, err);
    res.json(recordsListResponse([], 0, offset));
  }
}

async function handleRecordGet(req: Request, res: Response, forceAdmin: boolean) {
  const recordType = String(req.query.record_type ?? req.query.recordType ?? "").trim();
  const id = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  const resolveRecord = async () => {
    if (recordType && RECORD_TYPES.has(recordType)) {
      return getCompatRecord(recordType, id);
    }
    return findCompatRecordById(id);
  };

  if (!forceAdmin && !isRequestAdmin(req)) {
    const found = await resolveRecord();
    if (!found) {
      res.status(404).json({ error: "Kayıt bulunamadı." });
      return;
    }
    const { records } = await listCompatRecords(found.record_type, {
      limit: 10000,
      offset: 0,
      viewerId: req.localUser?.id,
      viewerEmail: req.localUser?.email,
      admin: false,
    });
    const owned = records.find((r) => String(r.id) === id);
    if (!owned) {
      res.status(404).json({ error: "Kayıt bulunamadı." });
      return;
    }
    res.json({ record: owned, data: owned });
    return;
  }

  const record = await resolveRecord();
  if (!record) {
    res.status(404).json({ error: "Kayıt bulunamadı." });
    return;
  }
  res.json({ record, data: record });
}

async function handleRecordCreate(req: Request, res: Response, forceAdmin: boolean) {
  const { recordType, data } = parseMutationBody(req);
  if (!recordType || !RECORD_TYPES.has(recordType)) {
    res.status(400).json({ error: "Geçersiz record_type." });
    return;
  }

  try {
    const record = await createCompatRecord(recordType, data, mutationContext(req, forceAdmin));
    res.status(201).json({ record, data: record });
  } catch (err) {
    sendMutationError(res, err);
  }
}

async function handleRecordUpdate(req: Request, res: Response, forceAdmin: boolean) {
  const id = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const { recordType, data } = parseMutationBody(req);
  if (!recordType || !RECORD_TYPES.has(recordType)) {
    res.status(400).json({ error: "Geçersiz record_type." });
    return;
  }

  try {
    const record = await updateCompatRecord(recordType, id, data, mutationContext(req, forceAdmin));
    res.json({ record, data: record });
  } catch (err) {
    sendMutationError(res, err);
  }
}

async function handleRecordDelete(req: Request, res: Response, forceAdmin: boolean) {
  const id = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const recordType = String(req.query.record_type ?? req.query.recordType ?? "").trim() || undefined;

  try {
    const result = await deleteCompatRecord(id, mutationContext(req, forceAdmin), recordType);
    res.json(result);
  } catch (err) {
    sendMutationError(res, err);
  }
}

/** VPS uyumluluğu — frontend fetchAllRecords */
router.get("/records", requireAuth, (req, res) => {
  void handleRecordsList(req, res, false);
});

router.get("/records/:id", requireAuth, (req, res) => {
  void handleRecordGet(req, res, false);
});

router.post("/records", requireAuth, (req, res) => {
  void handleRecordCreate(req, res, false);
});

router.put("/records/:id", requireAuth, (req, res) => {
  void handleRecordUpdate(req, res, false);
});

router.delete("/records/:id", requireAuth, (req, res) => {
  void handleRecordDelete(req, res, false);
});

/** VPS uyumluluğu — frontend fetchAllAdminRecords */
router.get("/admin/records", requireAdmin, (req, res) => {
  void handleRecordsList(req, res, true);
});

router.get("/admin/records/:id", requireAdmin, (req, res) => {
  void handleRecordGet(req, res, true);
});

router.post("/admin/records", requireAdmin, (req, res) => {
  void handleRecordCreate(req, res, true);
});

router.put("/admin/records/:id", requireAdmin, (req, res) => {
  void handleRecordUpdate(req, res, true);
});

router.delete("/admin/records/:id", requireAdmin, (req, res) => {
  void handleRecordDelete(req, res, true);
});

export default router;
