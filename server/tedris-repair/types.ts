export interface AppUserRecordData {
  id?: string;
  authUserId?: string;
  email?: string;
  loginEmail?: string;
  generatedEmail?: string;
  username?: string;
  name?: string;
  role?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  status?: string;
  district?: string | null;
  province?: string | null;
  institutionName?: string | null;
  institutionCode?: string | null;
  institutionId?: string | null;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
  passwordResetAt?: string | null;
}

export interface BackendRecord<T = unknown> {
  id: string | number;
  recordType?: string;
  record_type?: string;
  userId?: string | number;
  data?: T;
  updatedAt?: string;
  updated_at?: string;
  createdAt?: string;
  created_at?: string;
}

export interface BackendUser {
  id?: string | number;
  email?: string;
  name?: string;
  role?: string;
  isAdmin?: boolean;
}

export type RepairEmailCategory =
  | "alreadyLinked"
  | "authFoundWouldLink"
  | "authWouldCreate"
  | "appUserMissing"
  | "duplicateEmails"
  | "inactiveOrDeleted"
  | "missingEmail"
  | "failed";

/** Teşhis etiketleri (dry-run raporu; birden fazla aynı anda olabilir) */
export type RepairDiagnosticTag =
  | "appUserOwnerMismatch"
  | "authFoundWouldLink"
  | "authUserIdMismatch"
  | "duplicateEmail"
  | "inactiveDeleted"
  | "appUserMissing";

export interface RepairEmailDiagnosis {
  email: string;
  category: RepairEmailCategory;
  authUserId: string | null;
  authUserExists: boolean;
  appUserId: string | null;
  recordUserId: string | null;
  recordOwnerMatchesAuth: boolean;
  institutionName: string | null;
  diagnosticTags: RepairDiagnosticTag[];
  emailFields: {
    topLevel: string | null;
    dataEmail: string | null;
    loginEmail: string | null;
    generatedEmail: string | null;
    username: string | null;
    computed: string | null;
  };
  authUserIdOnRecord: string | null;
  authUserIdMatchesAuth: boolean;
  institutionCode: string | null;
  district: string | null;
  province: string | null;
  status: string | null;
  isActive: boolean | null;
  deletedAt: string | null;
  duplicateAppUserIds: string[];
  adminCatalogCandidatesByEmail: number;
  adminCatalogCandidatesByAuthId: number;
  loginScopedRecordsNote: string;
}

export interface RepairDryRunSummary {
  totalAppUsers: number;
  totalAuthUsers: number;
  activeAppUsers: number;
  missingTopLevelEmail: number;
  missingAnyEmail: number;
  missingAuthUserId: number;
  authFoundWouldLink: number;
  authWouldCreate: number;
  duplicateEmails: number;
  institutionMissing: number;
  inactiveOrDeleted: number;
  loginReadyUsers: number;
  loginBlockedUsers: number;
  alreadyLinked: number;
}

export interface RepairAppUserAuthLinksReport {
  ok: boolean;
  dryRun: boolean;
  totalAppUsers: number;
  uniqueEmails: number;
  alreadyLinked: number;
  emailNormalized: number;
  emailNormalizedWouldUpdate: number;
  authFoundAndLinked: number;
  authFoundWouldLink: number;
  authCreatedAndLinked: number;
  authWouldCreate: number;
  duplicatesDetected: number;
  skippedDeleted: number;
  failed: number;
  errors: { appUserId: string; email: string; reason: string }[];
  summary?: RepairDryRunSummary;
  emailDiagnosis?: RepairEmailDiagnosis[];
}

export interface RepairOptions {
  userIds?: string[];
  maxRecords?: number;
  dryRun?: boolean;
  /** Dry-run: ayrıntılı teşhis satırları (ör. burdurbaglarbasi@gmail.com) */
  diagnoseEmails?: string[];
}
