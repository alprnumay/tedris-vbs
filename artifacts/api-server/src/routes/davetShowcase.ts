import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { db, showcasePostsTable, type ShowcasePostRow } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAdmin, requireAuth } from "../middlewares/requireAdmin";

const router: IRouter = Router();

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "davet", "showcase");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function slugifyFilename(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-|-$/g, "") || "gorsel"
  );
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
    const base = slugifyFilename(path.basename(file.originalname, ext));
    cb(null, `${randomUUID()}-${base}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error("INVALID_FILE_TYPE"));
      return;
    }
    cb(null, true);
  },
});

function getActorUserId(req: Request): string | null {
  if (req.localUser?.id) return req.localUser.id;
  if (req.isAuthenticated() && req.user?.id) return req.user.id;
  return null;
}

function rowToJson(row: ShowcasePostRow) {
  return {
    id: row.id,
    institution_id: row.institutionId,
    institution_name: row.institutionName,
    district_name: row.districtName,
    category: row.category,
    title: row.title,
    image_url: row.imageUrl,
    purpose: row.purpose,
    student_activity: row.studentActivity,
    target_gain: row.targetGain,
    teacher_method: row.teacherMethod,
    how_to_apply: row.howToApply,
    result_note: row.resultNote,
    generated_text: row.generatedText,
    tags: row.tags ?? [],
    teacher_name: row.teacherName,
    status: row.status,
    revision_note: row.revisionNote,
    created_by_user_id: row.createdByUserId,
    approved_by_user_id: row.approvedByUserId,
    created_at: row.createdAt?.toISOString?.() ?? row.createdAt,
    updated_at: row.updatedAt?.toISOString?.() ?? row.updatedAt,
    approved_at: row.approvedAt?.toISOString?.() ?? row.approvedAt ?? null,
  };
}

function pickString(body: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = body[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickTags(body: Record<string, unknown>): string[] | null {
  const raw = body.tags ?? body.etiketler;
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((t) => String(t).trim()).filter(Boolean);
      }
    } catch {
      return raw.split(",").map((t) => t.trim()).filter(Boolean);
    }
  }
  return null;
}

router.post("/davet/upload", requireAuth, (req: Request, res: Response) => {
  upload.single("file")(req, res, (err: unknown) => {
    if (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "INVALID_FILE_TYPE") {
        res.status(400).json({ error: "Yalnızca JPG, PNG veya WEBP yüklenebilir." });
        return;
      }
      if ((err as { code?: string }).code === "LIMIT_FILE_SIZE") {
        res.status(413).json({ error: "Dosya boyutu en fazla 5 MB olabilir." });
        return;
      }
      res.status(400).json({ error: "Görsel yüklenemedi." });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Görsel dosyası gerekli." });
      return;
    }

    const url = `/uploads/davet/showcase/${file.filename}`;
    res.json({ url });
  });
});

router.post("/davet/showcase", requireAuth, async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const institutionName = pickString(body, "institution_name", "institutionName", "yurtAdi", "yurt_adi");
  const title = pickString(body, "title", "baslik");
  const category = pickString(body, "category", "kategori");

  if (!institutionName || !title || !category) {
    res.status(400).json({ error: "Kurum adı, başlık ve kategori zorunludur." });
    return;
  }

  const now = new Date();
  const [row] = await db
    .insert(showcasePostsTable)
    .values({
      institutionId: pickString(body, "institution_id", "institutionId") ?? null,
      institutionName,
      districtName: pickString(body, "district_name", "districtName", "mintika") ?? null,
      category,
      title,
      imageUrl: pickString(body, "image_url", "imageUrl", "fotografUrl") ?? null,
      purpose: pickString(body, "purpose", "amac") ?? null,
      studentActivity: pickString(body, "student_activity", "studentActivity", "talebelerNeYapti") ?? null,
      targetGain: pickString(body, "target_gain", "targetGain", "kazanim") ?? null,
      teacherMethod: pickString(body, "teacher_method", "teacherMethod", "uygulamaYontemi") ?? null,
      howToApply: pickString(body, "how_to_apply", "howToApply", "digerYurtlarNasil") ?? null,
      resultNote: pickString(body, "result_note", "resultNote", "sonuc") ?? null,
      generatedText: pickString(body, "generated_text", "generatedText", "otomatikMetin") ?? null,
      tags: pickTags(body),
      teacherName: pickString(body, "teacher_name", "teacherName", "hocaAdi") ?? null,
      status: "pending",
      createdByUserId: getActorUserId(req),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  res.status(201).json({ post: rowToJson(row) });
});

router.get("/davet/showcase/published", requireAuth, async (_req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(showcasePostsTable)
    .where(eq(showcasePostsTable.status, "published"))
    .orderBy(desc(showcasePostsTable.approvedAt), desc(showcasePostsTable.createdAt));

  res.json({ posts: rows.map(rowToJson) });
});

router.get("/davet/showcase/pending", requireAdmin, async (_req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(showcasePostsTable)
    .where(eq(showcasePostsTable.status, "pending"))
    .orderBy(desc(showcasePostsTable.createdAt));

  res.json({ posts: rows.map(rowToJson) });
});

router.get("/davet/showcase/admin", requireAdmin, async (_req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(showcasePostsTable)
    .orderBy(desc(showcasePostsTable.createdAt));

  res.json({ posts: rows.map(rowToJson) });
});

async function updatePostStatus(
  req: Request,
  res: Response,
  status: string,
  extra?: Partial<typeof showcasePostsTable.$inferInsert>,
) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    res.status(400).json({ error: "Geçersiz kayıt." });
    return;
  }

  const [existing] = await db
    .select()
    .from(showcasePostsTable)
    .where(eq(showcasePostsTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Kayıt bulunamadı." });
    return;
  }

  const now = new Date();
  const [row] = await db
    .update(showcasePostsTable)
    .set({
      status,
      updatedAt: now,
      ...extra,
    })
    .where(eq(showcasePostsTable.id, id))
    .returning();

  res.json({ post: rowToJson(row) });
}

router.patch("/davet/showcase/:id/approve", requireAdmin, async (req: Request, res: Response) => {
  const now = new Date();
  await updatePostStatus(req, res, "published", {
    approvedByUserId: getActorUserId(req),
    approvedAt: now,
    revisionNote: null,
  });
});

router.patch("/davet/showcase/:id/reject", requireAdmin, async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const note =
    pickString(body, "revision_note", "revisionNote", "note", "admin_note") ?? null;
  await updatePostStatus(req, res, "rejected", { revisionNote: note });
});

router.patch("/davet/showcase/:id/revision", requireAdmin, async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const note = pickString(body, "revision_note", "revisionNote", "note");
  if (!note) {
    res.status(400).json({ error: "Revize notu zorunludur." });
    return;
  }
  await updatePostStatus(req, res, "revision_requested", { revisionNote: note });
});

router.delete("/davet/showcase/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    res.status(400).json({ error: "Geçersiz kayıt." });
    return;
  }

  const [existing] = await db
    .select()
    .from(showcasePostsTable)
    .where(eq(showcasePostsTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Kayıt bulunamadı." });
    return;
  }

  if (existing.imageUrl?.startsWith("/uploads/davet/showcase/")) {
    const filename = path.basename(existing.imageUrl);
    const filePath = path.join(UPLOAD_DIR, filename);
    fs.unlink(filePath, () => {});
  }

  await db.delete(showcasePostsTable).where(eq(showcasePostsTable.id, id));
  res.json({ ok: true });
});

export default router;
