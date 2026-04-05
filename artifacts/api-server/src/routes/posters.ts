import { Router, type IRouter, type Request, type Response } from "express";
import { db, postersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

function getUserId(req: Request): string | null {
  if (req.localUser?.id) return req.localUser.id;
  if (req.isAuthenticated()) return req.user.id;
  return null;
}

router.get("/posters", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Oturum açmanız gerekiyor" });
    return;
  }
  const posters = await db
    .select()
    .from(postersTable)
    .where(eq(postersTable.userId, userId))
    .orderBy(desc(postersTable.createdAt));
  res.json({ posters });
});

router.post("/posters", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Oturum açmanız gerekiyor" });
    return;
  }
  const { title, sablon, formData } = req.body;
  if (!title || !sablon || !formData) {
    res.status(400).json({ error: "Eksik alanlar" });
    return;
  }
  const [poster] = await db
    .insert(postersTable)
    .values({ userId, title, sablon, formData: typeof formData === "string" ? formData : JSON.stringify(formData) })
    .returning();
  res.json({ poster });
});

router.put("/posters/:id", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Oturum açmanız gerekiyor" });
    return;
  }
  const id = Number(req.params.id);
  const { title, sablon, formData } = req.body;
  const [poster] = await db
    .update(postersTable)
    .set({
      title,
      sablon,
      formData: typeof formData === "string" ? formData : JSON.stringify(formData),
      updatedAt: new Date(),
    })
    .where(and(eq(postersTable.id, id), eq(postersTable.userId, userId)))
    .returning();
  if (!poster) {
    res.status(404).json({ error: "Afiş bulunamadı" });
    return;
  }
  res.json({ poster });
});

router.delete("/posters/:id", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Oturum açmanız gerekiyor" });
    return;
  }
  const id = Number(req.params.id);
  await db
    .delete(postersTable)
    .where(and(eq(postersTable.id, id), eq(postersTable.userId, userId)));
  res.json({ ok: true });
});

export default router;
