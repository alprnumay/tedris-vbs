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
}

export interface RepairOptions {
  userIds?: string[];
  maxRecords?: number;
  dryRun?: boolean;
}
