import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, localUsersTable, savedProfilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  createSession,
  clearSession,
  getSessionId,
  SESSION_COOKIE,
  SESSION_TTL,
} from "../lib/auth";

const router: IRouter = Router();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase();

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

router.post("/auth/register", async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: "Email, şifre ve ad soyad zorunludur." });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Şifre en az 6 karakter olmalıdır." });
    return;
  }

  const normalizedEmail = email.toLowerCase();

  const existing = await db
    .select()
    .from(localUsersTable)
    .where(eq(localUsersTable.email, normalizedEmail));

  if (existing.length > 0) {
    res.status(409).json({ error: "Bu e-posta adresi zaten kayıtlı." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(localUsersTable)
    .values({
      email: normalizedEmail,
      passwordHash,
      name,
    })
    .returning();

  const isAdmin =
    normalizedEmail === ADMIN_EMAIL || Boolean((user as any).isAdmin);

  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin,
  };

  const sid = await createSession({ localUser: sessionUser });
  setSessionCookie(res, sid);

  res.json({ user: sessionUser });
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email ve şifre zorunludur." });
    return;
  }

  const normalizedEmail = email.toLowerCase();

  const [user] = await db
    .select()
    .from(localUsersTable)
    .where(eq(localUsersTable.email, normalizedEmail));

  if (!user) {
    res.status(401).json({ error: "E-posta veya şifre hatalı." });
    return;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: "E-posta veya şifre hatalı." });
    return;
  }

  const isAdmin =
    normalizedEmail === ADMIN_EMAIL || Boolean((user as any).isAdmin);

  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin,
  };

  const sid = await createSession({ localUser: sessionUser });
  setSessionCookie(res, sid);

  res.json({ user: sessionUser });
});

router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ ok: true });
});

router.get("/auth/me", (req: Request, res: Response) => {
  if (req.localUser) {
    const localUser = req.localUser as {
      id: string;
      email: string;
      name: string;
      isAdmin?: boolean;
    };

    res.json({
      user: {
        id: localUser.id,
        email: localUser.email,
        name: localUser.name,
        isAdmin:
          Boolean(localUser.isAdmin) ||
          localUser.email?.toLowerCase() === ADMIN_EMAIL,
      },
    });
    return;
  }

  if (req.isAuthenticated() && req.user) {
    const u = req.user as {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
    };

    const email = (u.email ?? "").toLowerCase();
    const name =
      [u.firstName, u.lastName].filter(Boolean).join(" ") || "Kullanıcı";

    res.json({
      user: {
        id: u.id,
        email,
        name,
        isAdmin: email === ADMIN_EMAIL,
      },
    });
    return;
  }

  res.json({ user: null });
});

router.get("/profiles", async (req: Request, res: Response) => {
  const userId = req.localUser?.id;
  if (!userId) {
    res.status(401).json({ error: "Giriş yapınız." });
    return;
  }

  const profiles = await db
    .select()
    .from(savedProfilesTable)
    .where(eq(savedProfilesTable.userId, userId));

  res.json({ profiles });
});

router.post("/profiles", async (req: Request, res: Response) => {
  const userId = req.localUser?.id;
  if (!userId) {
    res.status(401).json({ error: "Giriş yapınız." });
    return;
  }

  const existing = await db
    .select()
    .from(savedProfilesTable)
    .where(eq(savedProfilesTable.userId, userId));

  if (existing.length >= 5) {
    res.status(400).json({ error: "En fazla 5 profil kaydedilebilir." });
    return;
  }

  const { isim, kurumAdi, rol } = req.body;

  const [profile] = await db
    .insert(savedProfilesTable)
    .values({
      userId,
      isim: isim || "",
      kurumAdi: kurumAdi || "",
      rol: rol || "",
    })
    .returning();

  res.json({ profile });
});

router.delete("/profiles/:id", async (req: Request, res: Response) => {
  const userId = req.localUser?.id;
  if (!userId) {
    res.status(401).json({ error: "Giriş yapınız." });
    return;
  }

  await db
    .delete(savedProfilesTable)
    .where(
      and(
        eq(savedProfilesTable.id, req.params.id),
        eq(savedProfilesTable.userId, userId),
      ),
    );

  res.json({ ok: true });
});

export default router;