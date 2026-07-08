import { Router, type IRouter, type Request, type Response } from "express";
import { db, localUsersTable, savedProfilesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { isAdminRole } from "../lib/roleUtils";
import { findLocalUserForLogin, findLocalUserById, type LoginUserRow } from "../lib/localUserLookup";
import {
  createSession,
  clearSession,
  getSessionId,
  SESSION_COOKIE,
  SESSION_TTL,
} from "../lib/auth";
import { sessionCookieOptions } from "../lib/sessionCookie";
import { hashPassword, verifyPassword, getPasswordHashRounds } from "../lib/passwordHash";
import {
  buildAuthLoginTimingPayload,
  logAuthLoginTiming,
  type AuthLoginTimingMetrics,
} from "../lib/authLoginTiming";
import { schedulePostLoginSideEffects } from "../lib/loginSideEffects";
import {
  AuthRequestTimer,
  loadTestTimingRequested,
  logAuthTiming,
} from "../lib/authRequestTiming";

const router: IRouter = Router();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase();

function mapLocalUserPublicProfile(user: LoginUserRow) {
  const role = user.role ?? "hoca";
  const isAdmin =
    user.email?.toLowerCase() === ADMIN_EMAIL ||
    user.isAdmin ||
    isAdminRole(role, user.isAdmin);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role,
    isAdmin,
    isActive: user.isActive,
    province: user.province ?? null,
    district: user.district ?? null,
    institutionId: user.institutionId ?? null,
    institutionName: user.institutionName ?? null,
    institutionCode: user.institutionCode ?? null,
    reportScopeType: user.reportScopeType ?? "own",
    reportScopeMintikas: Array.isArray(user.reportScopeMintikas) ? user.reportScopeMintikas : [],
  };
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, sessionCookieOptions(SESSION_TTL));
}

function attachTimingBody(
  req: Request,
  body: Record<string, unknown>,
  timing: AuthLoginTimingMetrics | ReturnType<AuthRequestTimer["finish"]>,
) {
  if (loadTestTimingRequested(req)) {
    return { ...body, _timing: timing };
  }
  return body;
}

router.post("/auth/register", async (req: Request, res: Response) => {
  const timer = new AuthRequestTimer();
  let status = 400;

  try {
    timer.mark("requestStartedMs");
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      status = 400;
      res.status(400).json({ error: "Email, şifre ve ad soyad zorunludur." });
      return;
    }

    if (password.length < 6) {
      status = 400;
      res.status(400).json({ error: "Şifre en az 6 karakter olmalıdır." });
      return;
    }

    const normalizedEmail = email.toLowerCase();

    const existing = await db
      .select()
      .from(localUsersTable)
      .where(eq(localUsersTable.email, normalizedEmail));
    timer.mark("dbUserLookupMs");

    if (existing.length > 0) {
      status = 409;
      const payload = attachTimingBody(req, { error: "Bu e-posta adresi zaten kayıtlı." }, timer.finish("auth/register", status, { email: normalizedEmail }));
      logAuthTiming(payload._timing as ReturnType<AuthRequestTimer["finish"]>);
      res.status(409).json(payload);
      return;
    }

    const passwordHash = await hashPassword(password);
    timer.mark("passwordHashMs");

    const [user] = await db
      .insert(localUsersTable)
      .values({
        email: normalizedEmail,
        passwordHash,
        name,
      })
      .returning();
    timer.mark("dbInsertMs");

    const isAdmin =
      normalizedEmail === ADMIN_EMAIL || isAdminRole(user.role, user.isAdmin);

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin,
    };

    const sid = await createSession({ localUser: sessionUser });
    timer.mark("sessionCreateMs");
    setSessionCookie(res, sid);

    status = 200;
    const timing = timer.finish("auth/register", status, { email: normalizedEmail });
    logAuthTiming(timing);
    res.json(attachTimingBody(req, { user: sessionUser, sessionToken: sid }, timing));
  } catch (err) {
    status = 500;
    logAuthTiming(timer.finish("auth/register", status));
    console.error("[auth/register]", err);
    res.status(500).json({ error: "Kayıt işlemi tamamlanamadı." });
  }
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const loginStarted = performance.now();
  let dbLookupMs = 0;
  let passwordCompareMs = 0;
  let profileLoadMs = 0;
  let tokenMs = 0;
  let status = 500;
  let hashRoundsInDb = 0;

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      status = 400;
      res.status(400).json({ error: "Email ve şifre zorunludur." });
      return;
    }

    const normalizedEmail = email.toLowerCase();

    const lookupStart = performance.now();
    const user = await findLocalUserForLogin(normalizedEmail);
    dbLookupMs = Math.round(performance.now() - lookupStart);

    if (!user) {
      status = 401;
      const timing = buildAuthLoginTimingPayload({
        dbLookupMs,
        passwordCompareMs: 0,
        profileLoadMs: 0,
        tokenMs: 0,
        responseMs: 0,
        totalMs: Math.round(performance.now() - loginStarted),
        status,
        email: normalizedEmail,
      });
      logAuthLoginTiming(timing);
      res.status(401).json(attachTimingBody(req, { error: "E-posta veya şifre hatalı." }, timing));
      return;
    }

    hashRoundsInDb = getPasswordHashRounds(user.passwordHash);

    const compareStart = performance.now();
    const isValid = await verifyPassword(password, user.passwordHash);
    passwordCompareMs = Math.round(performance.now() - compareStart);

    if (!isValid) {
      status = 401;
      const timing = buildAuthLoginTimingPayload({
        dbLookupMs,
        passwordCompareMs,
        profileLoadMs: 0,
        tokenMs: 0,
        responseMs: 0,
        totalMs: Math.round(performance.now() - loginStarted),
        status,
        email: normalizedEmail,
        hashRoundsInDb,
      });
      logAuthLoginTiming(timing);
      res.status(401).json(attachTimingBody(req, { error: "E-posta veya şifre hatalı." }, timing));
      return;
    }

    if (user.deletedAt || user.isActive === false) {
      status = 403;
      const timing = buildAuthLoginTimingPayload({
        dbLookupMs,
        passwordCompareMs,
        profileLoadMs: 0,
        tokenMs: 0,
        responseMs: 0,
        totalMs: Math.round(performance.now() - loginStarted),
        status,
        email: normalizedEmail,
        hashRoundsInDb,
      });
      logAuthLoginTiming(timing);
      res.status(403).json(
        attachTimingBody(req, { error: "Hesabınız pasif durumda. Yöneticinizle iletişime geçin." }, timing),
      );
      return;
    }

    const profileStart = performance.now();
    const publicUser = mapLocalUserPublicProfile(user);
    profileLoadMs = Math.round(performance.now() - profileStart);

    const tokenStart = performance.now();
    const sid = await createSession({
      localUser: {
        id: publicUser.id,
        email: publicUser.email,
        name: publicUser.name,
        isAdmin: publicUser.isAdmin,
      },
    });
    tokenMs = Math.round(performance.now() - tokenStart);
    setSessionCookie(res, sid);

    status = 200;
    const responseStart = performance.now();
    const totalMs = Math.round(performance.now() - loginStarted);
    const timing = buildAuthLoginTimingPayload({
      dbLookupMs,
      passwordCompareMs,
      profileLoadMs,
      tokenMs,
      responseMs: Math.round(performance.now() - responseStart),
      totalMs,
      status,
      email: normalizedEmail,
      hashRoundsInDb,
    });
    logAuthLoginTiming(timing);

    res.json(attachTimingBody(req, { user: publicUser, sessionToken: sid }, timing));
    schedulePostLoginSideEffects(user, password);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    status = 500;
    logAuthLoginTiming(
      buildAuthLoginTimingPayload({
        dbLookupMs,
        passwordCompareMs,
        profileLoadMs,
        tokenMs,
        responseMs: 0,
        totalMs: Math.round(performance.now() - loginStarted),
        status,
        hashRoundsInDb,
      }),
    );
    console.error("[auth/login]", detail, err);
    const schemaHint =
      /column|relation|does not exist|undefined column/i.test(detail)
        ? " Veritabanı şeması güncel değil — API sunucusunu yeniden başlatın (ensureDbSchema) veya pnpm db:push çalıştırın."
        : "";
    res.status(500).json({
      error: `Giriş işlemi tamamlanamadı.${schemaHint}`,
    });
  }
});

router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ ok: true });
});

router.get("/auth/me", async (req: Request, res: Response) => {
  const timer = new AuthRequestTimer();
  timer.mark("requestStartedMs");

  if (req.localUser?.id) {
    try {
      const user = await findLocalUserById(req.localUser.id);
      timer.mark("dbUserLookupMs");

      if (user && !user.deletedAt && user.isActive !== false) {
        const timing = timer.finish("auth/me", 200, { email: user.email });
        logAuthTiming(timing);
        res.json(attachTimingBody(req, { user: mapLocalUserPublicProfile(user) }, timing));
        return;
      }
    } catch (err) {
      console.error("[auth/me] local user load failed:", err);
    }
  }

  if (req.isAuthenticated() && req.user) {
    timer.mark("oidcSessionMs");
    const u = req.user as {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
    };

    const email = (u.email ?? "").toLowerCase();
    const name =
      [u.firstName, u.lastName].filter(Boolean).join(" ") || "Kullanıcı";

    const timing = timer.finish("auth/me", 200, { email });
    logAuthTiming(timing);
    res.json(
      attachTimingBody(
        req,
        {
          user: {
            id: u.id,
            email,
            name,
            isAdmin: email === ADMIN_EMAIL,
          },
        },
        timing,
      ),
    );
    return;
  }

  const timing = timer.finish("auth/me", 200);
  logAuthTiming(timing);
  res.json(attachTimingBody(req, { user: null }, timing));
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

  const profileId = (
    Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  ) as string;

  await db
    .delete(savedProfilesTable)
    .where(
      and(
        eq(savedProfilesTable.id, profileId),
        eq(savedProfilesTable.userId, userId),
      ),
    );

  res.json({ ok: true });
});

export default router;