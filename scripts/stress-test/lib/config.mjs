import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(__dirname, "../../..");
export const resultsDir = path.join(root, "load-test-results");

export const API_BASE = (process.env.API_BASE || "https://api.antalyanehari.xyz/api").replace(/\/$/, "");
export const ADMIN_EMAIL = process.env.LOAD_TEST_ADMIN_EMAIL || "";
export const ADMIN_PASSWORD = process.env.LOAD_TEST_ADMIN_PASSWORD || "";
export const PASSWORD = process.env.LOAD_TEST_PASSWORD || "LoadTest123!";
export const EMAIL_PREFIX = process.env.LOAD_TEST_EMAIL_PREFIX || "loadtest";
export const EMAIL_DOMAIN = process.env.LOAD_TEST_EMAIL_DOMAIN || "example.test";
export const DISTRICT = process.env.LOAD_TEST_DISTRICT || "Alanya";
export const INSTITUTION_NAME = process.env.LOAD_TEST_INSTITUTION_NAME || "LOAD_TEST_Yurdu";
export const INSTITUTION_CODE = process.env.LOAD_TEST_INSTITUTION_CODE || "LOAD_TEST_POOL";
export const TIMEOUT_MS = Number(process.env.LOAD_TEST_TIMEOUT_MS || 30_000);
export const RUN_ID = process.env.LOAD_TEST_RUN_ID || new Date().toISOString().replace(/[:.]/g, "-");

export function parseUsersArg(argv = process.argv.slice(2)) {
  for (const arg of argv) {
    if (arg.startsWith("--users=")) return Number(arg.split("=")[1]);
    if (/^\d+$/.test(arg)) return Number(arg);
  }
  return Number(process.env.LOAD_TEST_USERS || 25);
}

export function parseModeArg(argv = process.argv.slice(2)) {
  for (const arg of argv) {
    if (arg.startsWith("--mode=")) return arg.split("=")[1];
    if (arg === "--auth") return "auth";
    if (arg === "--app") return "app";
  }
  return process.env.LOAD_TEST_MODE || "app";
}

/** Koşular arası sabit — LOAD_TEST_ prefix ile havuz kullanıcıları */
export function emailForUser(userId) {
  return `${EMAIL_PREFIX}+LOAD_TEST_${userId}@${EMAIL_DOMAIN}`.toLowerCase();
}

export function userDisplayName(userId) {
  return `LOAD_TEST_Kullanici_${userId}`;
}

export function studentNameForUser(userId) {
  return `LOAD_TEST_Ogrenci_${userId}`;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function userPoolPath() {
  return path.join(resultsDir, "stress-user-pool.json");
}

export function readUserPool() {
  try {
    if (!fs.existsSync(userPoolPath())) return null;
    return JSON.parse(fs.readFileSync(userPoolPath(), "utf8"));
  } catch {
    return null;
  }
}

export function writeUserPool(data) {
  fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(userPoolPath(), JSON.stringify(data, null, 2), "utf8");
}
