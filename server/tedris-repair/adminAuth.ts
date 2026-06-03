import type { BackendUser } from "./types";

export function normalizeEmail(value?: string | null): string {
  return (value ?? "").trim().toLocaleLowerCase("tr-TR");
}

/** VPS /auth/me bazen { user } bazen düz kullanıcı döndürür. */
export function parseMeUser(payload: unknown): BackendUser | null {
  if (!payload || typeof payload !== "object") return null;
  const raw = payload as Record<string, unknown>;
  if (raw.user && typeof raw.user === "object") {
    return raw.user as BackendUser;
  }
  if (raw.id != null || typeof raw.email === "string") {
    return raw as BackendUser;
  }
  return null;
}

/** Oturum doğrulama yedek: JWT payload (imza VPS isteklerinde zaten kullanılır). */
export function userFromJwtPayload(token: string | undefined): BackendUser | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(b64, "base64").toString("utf8");
    const p = JSON.parse(json) as Record<string, unknown>;
    const id = p.id ?? p.userId ?? p.sub;
    const email = typeof p.email === "string" ? p.email : undefined;
    if (id == null && !email) return null;
    return {
      id: id as string | number,
      email,
      role: typeof p.role === "string" ? p.role : undefined,
      isAdmin: typeof p.isAdmin === "boolean" ? p.isAdmin : undefined,
    };
  } catch {
    return null;
  }
}

export function isAdminUser(user: BackendUser, configuredAdminEmail: string): boolean {
  const email = normalizeEmail(user.email);
  const role = String(user.role ?? "").trim().toLowerCase();
  const adminEmail = normalizeEmail(configuredAdminEmail);
  if (Boolean(user.isAdmin)) return true;
  if (role === "admin" || role === "super_admin") return true;
  if (adminEmail && email && email === adminEmail) return true;
  return false;
}

export function resolveAdminUser(mePayload: unknown, bearerToken?: string): BackendUser | null {
  const fromMe = parseMeUser(mePayload);
  if (fromMe?.id != null || fromMe?.email) return fromMe;
  return userFromJwtPayload(bearerToken);
}
