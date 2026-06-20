import { useCallback, useEffect, useState } from "react";
import {
  checkOkulTakipApiReady,
  fetchOkulTakipStore,
  removeStudent as apiRemoveStudent,
  saveDailyRecords as apiSaveDailyRecords,
  saveStudent as apiSaveStudent,
} from "@/modules/davet/okul-takip/okulTakipApi";
import type {
  DailyRecord,
  OkulTakipStore,
  Student,
} from "@/modules/davet/okul-takip/types";

const EMPTY_STORE: OkulTakipStore = { students: [], dailyRecords: [] };

let storeCache: OkulTakipStore = EMPTY_STORE;
let storeLoading = false;
let storeReady = false;
let storeApiIssue: string | null = null;
let reloadPromise: Promise<OkulTakipStore> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function getOkulTakipStore(): OkulTakipStore {
  return storeCache;
}

export function subscribeOkulTakip(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function reloadOkulTakipStore(): Promise<OkulTakipStore> {
  if (reloadPromise) return reloadPromise;

  storeLoading = true;
  notify();

  reloadPromise = (async () => {
    try {
      const apiCheck = await checkOkulTakipApiReady();
      storeApiIssue = apiCheck.ok ? null : apiCheck.message ?? null;
      if (!apiCheck.ok) {
        storeCache = EMPTY_STORE;
        return storeCache;
      }
      storeCache = await fetchOkulTakipStore();
    } catch (err) {
      console.warn("[okul-takip] store load failed", err);
      storeApiIssue = null;
      storeCache = EMPTY_STORE;
    } finally {
      storeLoading = false;
      storeReady = true;
      reloadPromise = null;
      notify();
    }
    return storeCache;
  })();

  return reloadPromise;
}

export async function upsertDailyRecords(records: DailyRecord[]): Promise<void> {
  const saved = await apiSaveDailyRecords(records);
  const map = new Map(storeCache.dailyRecords.map((r) => [`${r.studentId}-${r.date}`, r]));
  for (const rec of saved) {
    map.set(`${rec.studentId}-${rec.date}`, rec);
  }
  storeCache = { ...storeCache, dailyRecords: [...map.values()] };
  notify();
}

export async function upsertStudent(
  student: Student,
  institutionId?: string | null,
): Promise<Student> {
  const saved = await apiSaveStudent(student, institutionId);
  const idx = storeCache.students.findIndex((s) => s.id === student.id);
  const students =
    idx >= 0
      ? storeCache.students.map((s, i) => (i === idx ? saved : s))
      : [...storeCache.students, saved];
  storeCache = { ...storeCache, students };
  notify();
  return saved;
}

export async function deleteStudent(id: string): Promise<void> {
  await apiRemoveStudent(id);
  storeCache = {
    students: storeCache.students.filter((s) => s.id !== id),
    dailyRecords: storeCache.dailyRecords.filter((r) => r.studentId !== id),
  };
  notify();
}

export type OkulTakipStoreState = OkulTakipStore & {
  loading: boolean;
  ready: boolean;
  apiIssue: string | null;
};

export function useOkulTakipStore(): OkulTakipStoreState {
  const [, setTick] = useState(0);

  useEffect(() => subscribeOkulTakip(() => setTick((t) => t + 1)), []);

  useEffect(() => {
    if (!storeReady && !reloadPromise) {
      void reloadOkulTakipStore();
    }
  }, []);

  return {
    ...storeCache,
    loading: storeLoading,
    ready: storeReady,
    apiIssue: storeApiIssue,
  };
}

export function useOkulTakipActions() {
  const refresh = useCallback(() => reloadOkulTakipStore(), []);

  return {
    upsertDailyRecords,
    upsertStudent,
    deleteStudent,
    refresh,
  };
}

export function getRecordForStudentDate(
  records: DailyRecord[],
  studentId: string,
  date: string,
): DailyRecord | undefined {
  return records.find((r) => r.studentId === studentId && r.date === date);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
