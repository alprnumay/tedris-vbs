import { useCallback, useEffect, useState } from "react";
import { MOCK_DAILY_RECORDS, MOCK_STUDENTS } from "@/modules/davet/okul-takip/mockData";
import { STORAGE_KEY } from "@/modules/davet/okul-takip/constants";
import type {
  DailyRecord,
  OkulTakipStore,
  Student,
} from "@/modules/davet/okul-takip/types";

function loadStore(): OkulTakipStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as OkulTakipStore;
      if (parsed.students?.length && parsed.dailyRecords) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  return {
    students: MOCK_STUDENTS,
    dailyRecords: MOCK_DAILY_RECORDS,
  };
}

function saveStore(store: OkulTakipStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

let storeCache = loadStore();
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

export function resetOkulTakipStore() {
  storeCache = {
    students: MOCK_STUDENTS,
    dailyRecords: MOCK_DAILY_RECORDS,
  };
  saveStore(storeCache);
  notify();
}

export function upsertDailyRecords(records: DailyRecord[]) {
  const map = new Map(storeCache.dailyRecords.map((r) => [`${r.studentId}-${r.date}`, r]));
  const now = new Date().toISOString();
  for (const rec of records) {
    const key = `${rec.studentId}-${rec.date}`;
    const existing = map.get(key);
    map.set(key, {
      ...rec,
      id: existing?.id ?? rec.id,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }
  storeCache = { ...storeCache, dailyRecords: [...map.values()] };
  saveStore(storeCache);
  notify();
}

export function upsertStudent(student: Student) {
  const idx = storeCache.students.findIndex((s) => s.id === student.id);
  const students =
    idx >= 0
      ? storeCache.students.map((s, i) => (i === idx ? student : s))
      : [...storeCache.students, student];
  storeCache = { ...storeCache, students };
  saveStore(storeCache);
  notify();
}

export function deleteStudent(id: string) {
  storeCache = {
    students: storeCache.students.filter((s) => s.id !== id),
    dailyRecords: storeCache.dailyRecords.filter((r) => r.studentId !== id),
  };
  saveStore(storeCache);
  notify();
}

export function useOkulTakipStore(): OkulTakipStore {
  const [, setTick] = useState(0);
  useEffect(() => subscribeOkulTakip(() => setTick((t) => t + 1)), []);
  return storeCache;
}

export function useOkulTakipActions() {
  const refresh = useCallback(() => {
    storeCache = loadStore();
    notify();
  }, []);

  return {
    upsertDailyRecords,
    upsertStudent,
    deleteStudent,
    resetOkulTakipStore,
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
