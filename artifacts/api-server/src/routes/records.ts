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

const router: IRouter = Router();

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

/** VPS uyumluluğu — frontend fetchAllRecords */
router.get("/records", requireAuth, (req, res) => {
  void handleRecordsList(req, res, false);
});

router.get("/records/:id", requireAuth, (req, res) => {
  void handleRecordGet(req, res, false);
});

/** VPS uyumluluğu — frontend fetchAllAdminRecords */
router.get("/admin/records", requireAdmin, (req, res) => {
  void handleRecordsList(req, res, true);
});

router.get("/admin/records/:id", requireAdmin, (req, res) => {
  void handleRecordGet(req, res, true);
});

export default router;
