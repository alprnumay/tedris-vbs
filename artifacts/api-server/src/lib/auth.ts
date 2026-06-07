import * as client from "openid-client";
import crypto from "crypto";
import { type Request, type Response } from "express";
import { sql, eq } from "drizzle-orm";
import { db, sessionsTable } from "@workspace/db";
import type { AuthUser } from "@workspace/api-zod";
import { sessionCookieOptions } from "./sessionCookie";

export const ISSUER_URL = process.env.ISSUER_URL ?? "https://replit.com/oidc";
export const SESSION_COOKIE = "sid";
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

export interface LocalUserSession {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
}

export interface SessionData {
  user?: AuthUser;
  localUser?: LocalUserSession;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

let oidcConfig: client.Configuration | null = null;

export async function getOidcConfig(): Promise<client.Configuration> {
  if (!oidcConfig) {
    oidcConfig = await client.discovery(
      new URL(ISSUER_URL),
      process.env.REPL_ID!,
    );
  }
  return oidcConfig;
}

async function ensureSessionsTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      sid varchar PRIMARY KEY,
      sess jsonb NOT NULL,
      expire timestamptz NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire)
  `);
}

export async function createSession(data: SessionData): Promise<string> {
  const sid = crypto.randomBytes(32).toString("hex");
  const expire = new Date(Date.now() + SESSION_TTL);

  try {
    await db.insert(sessionsTable).values({
      sid,
      sess: data as unknown as Record<string, unknown>,
      expire,
    });
  } catch (err) {
    console.warn("[createSession] drizzle insert failed, ensuring table", err);
    await ensureSessionsTable();
    await db.execute(sql`
      INSERT INTO sessions (sid, sess, expire)
      VALUES (${sid}, ${JSON.stringify(data)}::jsonb, ${expire.toISOString()}::timestamptz)
    `);
  }

  return sid;
}

export async function getSession(sid: string): Promise<SessionData | null> {
  const [row] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.sid, sid));

  if (!row || row.expire < new Date()) {
    if (row) await deleteSession(sid);
    return null;
  }

  return row.sess as unknown as SessionData;
}

export async function updateSession(
  sid: string,
  data: SessionData,
): Promise<void> {
  await db
    .update(sessionsTable)
    .set({
      sess: data as unknown as Record<string, unknown>,
      expire: new Date(Date.now() + SESSION_TTL),
    })
    .where(eq(sessionsTable.sid, sid));
}

export async function deleteSession(sid: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.sid, sid));
}

export async function clearSession(
  res: Response,
  sid?: string,
): Promise<void> {
  if (sid) await deleteSession(sid);

  res.clearCookie(SESSION_COOKIE, sessionCookieOptions());
}

export function getSessionId(req: Request): string | undefined {
  const fromCookie = req.cookies?.[SESSION_COOKIE];
  if (typeof fromCookie === "string" && fromCookie.trim()) {
    return fromCookie.trim();
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  return undefined;
}