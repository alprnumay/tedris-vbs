import type { CookieOptions } from "express";

export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Oturum çerezi: üretimde cross-site (Vercel ↔ Render) için Secure + SameSite=None. */
export function sessionCookieOptions(maxAge?: number): CookieOptions {
  const base: CookieOptions = {
    httpOnly: true,
    path: "/",
  };
  if (maxAge !== undefined) base.maxAge = maxAge;

  if (isProductionEnv()) {
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
    secure: isProductionEnv(),
  };
}
