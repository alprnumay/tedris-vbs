import { sql } from "drizzle-orm";
import { db, institutionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { findLocalUserById } from "./localUserLookup";
import {
  linkUserToInstitution,
  resolveInstitution,
  type ResolvedInstitution,
} from "./institutionRegistry";
import { normalizeDistrictName } from "./trackedDistricts";
import {
  institutionCompareKey,
  normalizeInstitutionName,
  type OwnerContext,
} from "./okulTakipFields";
import { getCompatRecord } from "./recordsCompat";

export class OkulTakipInstitutionError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "OkulTakipInstitutionError";
  }
}

export const UNMAPPED_INSTITUTION_LABEL = "Eşleştirilmemiş Kayıtlar";

export type ResolvedStudentInstitution = {
  institutionId: string | null;
  institutionName: string;
  mintikaName: string;
  needsInstitutionMapping: boolean;
};

export type ViewerInstitutionOption = {
  id: string;
  institutionName: string;
  mintikaName: string;
  isPrimary: boolean;
};

function foldTr(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

/** Eşleştirme için agresif normalize — yurt/yurdu ekleri ve Türkçe karakter farkları */
export function institutionMatchKey(name: string | null | undefined): string {
  const base = normalizeInstitutionName(name)
    .replace(/\s+yurdu$/i, "")
    .replace(/\s+yurt$/i, "")
    .replace(/\s+kurumu$/i, "")
    .trim();
  return foldTr(base);
}

let institutionCache: { loadedAt: number; rows: ResolvedInstitution[] } | null = null;

async function loadInstitutionRegistry(): Promise<ResolvedInstitution[]> {
  const now = Date.now();
  if (institutionCache && now - institutionCache.loadedAt < 60_000) {
    return institutionCache.rows;
  }

  const rows = await db
    .select({
      id: institutionsTable.id,
      institutionName: institutionsTable.institutionName,
      institutionCode: institutionsTable.institutionCode,
      districtName: institutionsTable.districtName,
      province: institutionsTable.province,
      status: institutionsTable.status,
    })
    .from(institutionsTable);

  const list = rows
    .filter((row) => row.status !== "pasif" && row.status !== "kapali" && row.status !== "takip_disi")
    .map((row) => ({
      id: row.id,
      institutionCode: row.institutionCode,
      institutionName: row.institutionName,
      districtName: normalizeDistrictName(row.districtName) ?? row.districtName,
      province: row.province,
    }));

  institutionCache = { loadedAt: now, rows: list };
  return list;
}

export async function matchInstitutionByName(
  rawName: string | null | undefined,
  mintikaHint?: string | null,
): Promise<ResolvedInstitution | null> {
  const name = normalizeInstitutionName(rawName);
  if (!name) return null;

  const key = institutionMatchKey(name);
  const mintikaKey = mintikaHint
    ? institutionCompareKey(normalizeDistrictName(mintikaHint) ?? mintikaHint)
    : null;
  const registry = await loadInstitutionRegistry();

  for (const inst of registry) {
    const instKey = institutionMatchKey(inst.institutionName);
    const codeKey = institutionMatchKey(inst.institutionCode);
    const nameMatches =
      instKey === key ||
      codeKey === key ||
      institutionCompareKey(inst.institutionName) === institutionCompareKey(name);
    if (!nameMatches) continue;
    if (mintikaKey && institutionCompareKey(inst.districtName) !== mintikaKey) continue;
    return inst;
  }

  const district = normalizeDistrictName(mintikaHint) ?? mintikaHint?.trim();
  if (district) {
    return resolveInstitution({ district, institutionName: name });
  }

  return null;
}

export async function loadInstitutionById(id: string | null | undefined): Promise<ResolvedInstitution | null> {
  if (!id?.trim()) return null;
  const [row] = await db
    .select()
    .from(institutionsTable)
    .where(eq(institutionsTable.id, id.trim()))
    .limit(1);
  if (!row) return null;
  if (row.status === "pasif" || row.status === "kapali" || row.status === "takip_disi") return null;
  return {
    id: row.id,
    institutionCode: row.institutionCode,
    institutionName: row.institutionName,
    districtName: normalizeDistrictName(row.districtName) ?? row.districtName,
    province: row.province,
  };
}

async function resolveFromUserProfile(userId: string): Promise<ResolvedInstitution | null> {
  const user = await findLocalUserById(userId);
  if (!user) return null;

  if (user.institutionId) {
    const linked = await loadInstitutionById(user.institutionId);
    if (linked) return linked;
  }

  const institutionName = normalizeInstitutionName(user.institutionName);
  const district = normalizeDistrictName(user.district) ?? user.district?.trim();
  if (!institutionName || !district) return null;

  const inst = await resolveInstitution({
    district,
    institutionName,
    institutionCode: user.institutionCode,
    province: user.province,
  });
  if (inst && !user.institutionId) {
    await linkUserToInstitution(userId, inst);
  }
  return inst;
}

export async function getViewerInstitutionOptions(ctx: OwnerContext): Promise<ViewerInstitutionOption[]> {
  if (!ctx.viewerId) return [];
  const primary = await resolveFromUserProfile(ctx.viewerId);
  if (!primary) return [];
  return [
    {
      id: primary.id,
      institutionName: primary.institutionName,
      mintikaName: primary.districtName,
      isPrimary: true,
    },
  ];
}

export async function resolveInstitutionForViewer(
  ctx: OwnerContext,
  requestedInstitutionId?: string | null,
  legacyInstitutionName?: string | null,
): Promise<ResolvedStudentInstitution> {
  if (!ctx.viewerId) {
    throw new OkulTakipInstitutionError("Oturum gerekli.", 401);
  }

  const userInst = await resolveFromUserProfile(ctx.viewerId);
  const requestedId = requestedInstitutionId?.trim() || null;

  if (userInst) {
    if (requestedId && requestedId !== userInst.id) {
      throw new OkulTakipInstitutionError("Yalnızca hesabınıza bağlı yurda öğrenci ekleyebilirsiniz.", 403);
    }
    return {
      institutionId: userInst.id,
      institutionName: userInst.institutionName,
      mintikaName: userInst.districtName,
      needsInstitutionMapping: false,
    };
  }

  const legacyName = normalizeInstitutionName(legacyInstitutionName);
  const user = await findLocalUserById(ctx.viewerId);
  const mintikaHint = normalizeDistrictName(user?.district) ?? user?.district ?? null;
  const matched = await matchInstitutionByName(legacyName, mintikaHint);

  if (matched) {
    if (requestedId && requestedId !== matched.id) {
      throw new OkulTakipInstitutionError("Seçilen kurum hesabınızla eşleşmiyor.", 403);
    }
    return {
      institutionId: matched.id,
      institutionName: matched.institutionName,
      mintikaName: matched.districtName,
      needsInstitutionMapping: false,
    };
  }

  return {
    institutionId: null,
    institutionName: legacyName || normalizeInstitutionName(user?.institutionName) || UNMAPPED_INSTITUTION_LABEL,
    mintikaName: mintikaHint ?? "",
    needsInstitutionMapping: true,
  };
}

export async function resolveInstitutionFromStudentData(
  studentData: Record<string, unknown>,
  ownerUserId?: string | null,
): Promise<ResolvedStudentInstitution> {
  const existingId = studentData.institutionId != null ? String(studentData.institutionId).trim() : "";
  if (existingId) {
    const linked = await loadInstitutionById(existingId);
    if (linked) {
      return {
        institutionId: linked.id,
        institutionName: linked.institutionName,
        mintikaName: linked.districtName,
        needsInstitutionMapping: false,
      };
    }
  }

  const legacyName = normalizeInstitutionName(
    String(studentData.institutionName ?? studentData.institution ?? ""),
  );
  let mintikaHint =
    normalizeDistrictName(String(studentData.mintikaName ?? "")) ??
    String(studentData.mintikaName ?? "").trim();

  if (!mintikaHint && ownerUserId) {
    const owner = await findLocalUserById(ownerUserId);
    mintikaHint = normalizeDistrictName(owner?.district) ?? owner?.district ?? "";
  }

  const matched = await matchInstitutionByName(legacyName, mintikaHint);
  if (matched) {
    return {
      institutionId: matched.id,
      institutionName: matched.institutionName,
      mintikaName: matched.districtName,
      needsInstitutionMapping: false,
    };
  }

  return {
    institutionId: null,
    institutionName: legacyName || UNMAPPED_INSTITUTION_LABEL,
    mintikaName: mintikaHint ?? "",
    needsInstitutionMapping: Boolean(legacyName),
  };
}

export async function listUnmappedStudents(limit = 200): Promise<
  Array<{
    studentId: string;
    name: string;
    institutionName: string;
    mintikaName: string;
    ownerUserId: string | null;
  }>
> {
  const result = await db.execute(sql`
    SELECT
      s.id,
      s.user_id,
      s.data->>'name' AS name,
      COALESCE(s.data->>'institutionName', s.data->>'institution') AS institution_name,
      COALESCE(s.data->>'mintikaName', u.district_name) AS mintika_name,
      s.data->>'institutionId' AS institution_id,
      s.data->>'needsInstitutionMapping' AS needs_mapping
    FROM compat_records s
    LEFT JOIN local_users u ON u.id = s.user_id
    WHERE s.record_type = 'okul_student'
      AND (s.data->>'isActive' IS NULL OR s.data->>'isActive' <> 'false')
      AND (
        s.data->>'needsInstitutionMapping' = 'true'
        OR s.data->>'institutionId' IS NULL
        OR trim(s.data->>'institutionId') = ''
      )
    ORDER BY s.updated_at DESC
    LIMIT ${Math.min(Math.max(limit, 1), 1000)}
  `);

  return ((result.rows ?? []) as Record<string, unknown>[])
    .map((row) => ({
      studentId: String(row.id ?? ""),
      name: String(row.name ?? ""),
      institutionName: String(row.institution_name ?? ""),
      mintikaName: String(row.mintika_name ?? ""),
      ownerUserId: row.user_id != null ? String(row.user_id) : null,
    }))
    .filter((row) => row.studentId);
}

export async function remapStudentInstitution(
  studentId: string,
  institutionId: string,
): Promise<{ ok: true }> {
  const inst = await loadInstitutionById(institutionId);
  if (!inst) throw new OkulTakipInstitutionError("Kurum bulunamadı.", 404);

  const student = await getCompatRecord("okul_student", studentId);
  if (!student) throw new OkulTakipInstitutionError("Öğrenci bulunamadı.", 404);

  const data = { ...(student.data ?? {}) };
  data.institutionId = inst.id;
  data.institutionName = inst.institutionName;
  data.institution = inst.institutionName;
  data.mintikaName = inst.districtName;
  data.needsInstitutionMapping = false;

  await db.execute(sql`
    UPDATE compat_records
    SET data = ${JSON.stringify(data)}::jsonb,
        updated_at = NOW()
    WHERE id = ${studentId} AND record_type = 'okul_student'
  `);

  return { ok: true };
}
