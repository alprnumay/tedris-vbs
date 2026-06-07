import { type Request, type Response, type NextFunction } from "express";
import { findLocalUserById, isLoginUserAdmin } from "../lib/localUserLookup";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase();

export function isRequestAdmin(req: Request): boolean {
  if (req.localUser?.id) {
    const email = (req.localUser.email || "").toLowerCase();
    return Boolean(req.localUser.isAdmin) || email === ADMIN_EMAIL;
  }
  if (req.isAuthenticated() && req.user) {
    const email = ((req.user as { email?: string }).email || "").toLowerCase();
    return email === ADMIN_EMAIL;
  }
  return false;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.localUser?.id && !req.isAuthenticated()) {
    res.status(401).json({ error: "Giriş yapmanız gerekiyor." });
    return;
  }
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.localUser?.id && !req.isAuthenticated()) {
    res.status(401).json({ error: "Giriş yapmanız gerekiyor." });
    return;
  }

  if (req.localUser?.id) {
    try {
      const user = await findLocalUserById(req.localUser.id);
      if (user && isLoginUserAdmin(user)) {
        next();
        return;
      }
    } catch (err) {
      console.error("[requireAdmin] user reload failed:", err);
    }
  }

  if (isRequestAdmin(req)) {
    next();
    return;
  }

  res.status(403).json({ error: "Bu işlem için yönetici yetkisi gerekir." });
}
