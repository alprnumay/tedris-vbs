import type { CookieOptions } from "express";

/** Yerel `pnpm dev` — yalnızca açıkça development. */
export function isDevelopmentEnv(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Frontend ve API farklı origin.
 * NODE_ENV production olmasa bile cross-site sid gerekir.
 */
export function useCrossSiteSessionCookie(): boolean {
  if (isDevelopmentEnv()) return false;
  if (process.env.NODE_ENV === "production") return true;
  if (process.env.SESSION_COOKIE_CROSS_SITE === "true") return true;
  if (process.env.SESSION_COOKIE_CROSS_SITE === "false") return false;
  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_NAME) {
    return true;
  }
  if (process.env.FRONTEND_URL?.trim()) return true;
  return false;
}

/** Oturum çerezi (sid): cross-site deploy → Secure + SameSite=None. */
export function sessionCookieOptions(maxAge?: number): CookieOptions {
  const base: CookieOptions = {
    httpOnly: true,
    path: "/",
  };
  if (maxAge !== undefined) base.maxAge = maxAge;

  if (useCrossSiteSessionCookie()) {
    return { ...base, secure: true, sameSite: "none" };
  }
  return { ...base, secure: false, sameSite: "lax" };
}

/** OIDC akış çerezleri (aynı API host üzerinde kalır). */
export function oauthFlowCookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    path: "/",
    maxAge,
    sameSite: "lax",
    secure: useCrossSiteSessionCookie(),
  };
}
