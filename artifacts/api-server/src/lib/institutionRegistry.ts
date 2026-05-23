import { db, institutionsTable, localUsersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { kurumKoduOner } from "./institutionSlug";
import { normalizeDistrictName } from "./trackedDistricts";

export function normalizeInstitutionCode(code: string | null | undefined): string {
  return (code ?? "").trim().toLowerCase();
}

export type ResolvedInstitution = {
  id: string;
  institutionCode: string;
  institutionName: string;
  districtName: string;
  province: string | null;
};

/** Mıntıka + kurum adından tekil kurum kaydı bulur veya oluşturur */
export async function resolveInstitution(params: {
  district: string;
  institutionName: string;
  institutionCode?: string | null;
  province?: string | null;
}): Promise<ResolvedInstitution | null> {
  const institutionName = params.institutionName?.trim();
  const districtRaw = params.district?.trim();
  if (!institutionName || !districtRaw) return null;

  const districtName = normalizeDistrictName(districtRaw) ?? districtRaw;
  const institutionCode = normalizeInstitutionCode(
    params.institutionCode?.trim() || kurumKoduOner(districtName, institutionName),
  );
  if (!institutionCode) return null;

  const [byCode] = await db
    .select()
    .from(institutionsTable)
    .where(sql`lower(${institutionsTable.institutionCode}) = ${institutionCode}`)
    .limit(1);

  if (byCode) {
    const updates: Partial<typeof institutionsTable.$inferInsert> = { updatedAt: new Date() };
    if (!byCode.institutionName && institutionName) updates.institutionName = institutionName;
    if (!byCode.province && params.province) updates.province = params.province.trim();
    if (Object.keys(updates).length > 1) {
      await db.update(institutionsTable).set(updates).where(eq(institutionsTable.id, byCode.id));
    }
    return {
      id: byCode.id,
      institutionCode: byCode.institutionCode,
      institutionName: byCode.institutionName || institutionName,
      districtName: normalizeDistrictName(byCode.districtName) ?? byCode.districtName,
      province: byCode.province ?? params.province?.trim() ?? null,
    };
  }

  const [row] = await db
    .insert(institutionsTable)
    .values({
      institutionCode,
      institutionName,
      districtName,
      province: params.province?.trim() || null,
      status: "aktif",
    })
    .returning();

  if (!row) return null;
  return {
    id: row.id,
    institutionCode: row.institutionCode,
    institutionName: row.institutionName,
    districtName: row.districtName,
    province: row.province,
  };
}

export async function linkUserToInstitution(
  userId: string,
  inst: ResolvedInstitution,
): Promise<void> {
  await db
    .update(localUsersTable)
    .set({
      institutionId: inst.id,
      institutionCode: inst.institutionCode,
      institutionName: inst.institutionName,
      district: inst.districtName,
      province: inst.province,
    })
    .where(eq(localUsersTable.id, userId));
}

/** @deprecated resolveInstitution + linkUserToInstitution kullanın */
export async function upsertInstitutionFromUser(data: {
  institutionCode: string;
  institutionName: string;
  district: string;
  province?: string | null;
}) {
  const inst = await resolveInstitution({
    district: data.district,
    institutionName: data.institutionName,
    institutionCode: data.institutionCode,
    province: data.province,
  });
  return inst?.id ?? null;
}

export async function reconcileUsersWithInstitutions(): Promise<{
  linked: number;
  institutionsCreated: number;
  skipped: number;
  unmatched: { id: string; name: string; email: string; reason: string }[];
}> {
  const users = await db.select().from(localUsersTable);
  let linked = 0;
  let institutionsCreated = 0;
  let skipped = 0;
  const unmatched: { id: string; name: string; email: string; reason: string }[] = [];

  for (const u of users) {
    const district = u.district?.trim();
    const institutionName = u.institutionName?.trim();
    let code = u.institutionCode?.trim();

    if (!district && !institutionName && !code) {
      unmatched.push({
        id: u.id,
        name: u.name,
        email: u.email,
        reason: "Mıntıka ve kurum bilgisi yok",
      });
      skipped += 1;
      continue;
    }

    if (!institutionName) {
      unmatched.push({
        id: u.id,
        name: u.name,
        email: u.email,
        reason: "Kurum adı eksik",
      });
      skipped += 1;
      continue;
    }

    if (!district) {
      unmatched.push({
        id: u.id,
        name: u.name,
        email: u.email,
        reason: "Mıntıka eksik",
      });
      skipped += 1;
      continue;
    }

    const beforeCount = await db.select({ id: institutionsTable.id }).from(institutionsTable);
    const inst = await resolveInstitution({
      district,
      institutionName,
      institutionCode: code,
      province: u.province,
    });

    if (!inst) {
      unmatched.push({
        id: u.id,
        name: u.name,
        email: u.email,
        reason: "Kurum kaydı oluşturulamadı",
      });
      skipped += 1;
      continue;
    }

    const afterCount = await db.select({ id: institutionsTable.id }).from(institutionsTable);
    if (afterCount.length > beforeCount.length) institutionsCreated += 1;

    await linkUserToInstitution(u.id, inst);
    linked += 1;
  }

  return { linked, institutionsCreated, skipped, unmatched };
}
