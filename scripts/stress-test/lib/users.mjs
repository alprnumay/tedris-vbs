import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  DISTRICT,
  INSTITUTION_CODE,
  INSTITUTION_NAME,
  PASSWORD,
  RUN_ID,
  emailForUser,
  readUserPool,
  userDisplayName,
  writeUserPool,
  EMAIL_PREFIX,
  EMAIL_DOMAIN,
} from "./config.mjs";
import { apiRequest } from "./http.mjs";

export async function adminLogin() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return null;
  const res = await apiRequest("POST", "/auth/login", {
    endpoint: "admin_auth_login",
    expected: [200, 401, 403],
    phase: "setup",
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  if (res.status !== 200) return null;
  return res.json?.sessionToken || null;
}

export async function setupAdminInstitution(adminToken) {
  if (!adminToken) return;
  await apiRequest("POST", "/admin/institutions-registry", {
    token: adminToken,
    endpoint: "admin_institution_create",
    expected: [200, 201, 400, 409],
    phase: "setup",
    body: {
      institutionName: INSTITUTION_NAME,
      institutionCode: INSTITUTION_CODE,
      districtName: DISTRICT,
      province: "Antalya",
      status: "aktif",
      notes: `LOAD_TEST_${RUN_ID}`,
    },
  });
}

function expectedPoolEmails(count) {
  return Array.from({ length: count }, (_, i) => emailForUser(i + 1));
}

function poolCoversCount(existing, count) {
  if (!existing || existing.count < count) return false;
  const expected = expectedPoolEmails(count);
  const known = new Set(existing.emails ?? []);
  return expected.every((email) => known.has(email));
}

/**
 * Gerçek kullanım: kullanıcılar önceden oluşturulur.
 * Havuz hazırsa hiç register/create çağrısı yapılmaz.
 * @param {number} count
 * @param {string | null} adminToken
 */
export async function ensureLoadTestUserPool(count, adminToken) {
  const existing = readUserPool();

  if (poolCoversCount(existing, count)) {
    return {
      created: 0,
      skipped: count,
      alreadyReady: true,
      registerUsed: false,
      method: "existing_pool",
    };
  }

  const created = [];
  const skipped = [];
  let registerUsed = false;

  for (let userId = 1; userId <= count; userId += 1) {
    const email = emailForUser(userId);
    if (existing?.emails?.includes(email)) {
      skipped.push(email);
      continue;
    }

    let result;
    if (adminToken) {
      result = await apiRequest("POST", "/admin/users", {
        token: adminToken,
        endpoint: "setup_admin_create_user",
        expected: [200, 201, 409],
        phase: "setup",
        body: {
          email,
          password: PASSWORD,
          name: userDisplayName(userId),
          province: "Antalya",
          district: DISTRICT,
          institutionName: INSTITUTION_NAME,
          institutionCode: INSTITUTION_CODE,
          role: "hoca",
          isActive: true,
        },
      });
    } else {
      registerUsed = true;
      result = await apiRequest("POST", "/auth/register", {
        endpoint: "setup_auth_register",
        expected: [200, 201, 409],
        phase: "setup",
        includeServerTiming: true,
        body: { email, password: PASSWORD, name: userDisplayName(userId) },
      });
    }

    if (result.status === 409) skipped.push(email);
    else created.push(email);
  }

  const emails = expectedPoolEmails(count);
  writeUserPool({
    runId: RUN_ID,
    updatedAt: new Date().toISOString(),
    count,
    institutionName: INSTITUTION_NAME,
    institutionCode: INSTITUTION_CODE,
    emails,
    created,
    skipped,
    registerUsed,
    method: adminToken ? "admin_api" : "register_fallback",
  });

  return {
    created: created.length,
    skipped: skipped.length,
    alreadyReady: false,
    registerUsed,
    method: adminToken ? "admin_api" : "register_fallback",
  };
}

export async function loginUser(userId, { phase = "load", includeServerTiming = false } = {}) {
  const email = emailForUser(userId);
  const res = await apiRequest("POST", "/auth/login", {
    endpoint: "auth_login",
    expected: [200],
    phase,
    includeServerTiming,
    body: { email, password: PASSWORD },
  });
  return res.json?.sessionToken || null;
}

export function authTestEmailForUser(userId) {
  return `${EMAIL_PREFIX}+LOAD_TEST_AUTH_${RUN_ID}_${userId}@${EMAIL_DOMAIN}`.toLowerCase();
}
