import type { PersistedAppState } from "@/types";

export const APP_STORAGE_KEY = "post-op-eye-drops-assistant:v1";

export function createInitialAppState(): PersistedAppState {
  return {
    schemaVersion: 1,
    treatmentPlan: null,
    doseRecords: [],
    activeSession: null,
    generatedAt: new Date().toISOString()
  };
}

export function loadAppState(): PersistedAppState {
  if (typeof window === "undefined") {
    return createInitialAppState();
  }

  try {
    const raw = window.localStorage.getItem(APP_STORAGE_KEY);
    if (!raw) {
      return createInitialAppState();
    }
    const parsed = JSON.parse(raw) as Partial<PersistedAppState>;
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.doseRecords)) {
      return createInitialAppState();
    }
    return {
      schemaVersion: 1,
      treatmentPlan: parsed.treatmentPlan ?? null,
      doseRecords: parsed.doseRecords,
      activeSession: parsed.activeSession ?? null,
      generatedAt: parsed.generatedAt ?? new Date().toISOString()
    };
  } catch {
    return createInitialAppState();
  }
}

export function saveAppState(state: PersistedAppState): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
}

export function clearAppState(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(APP_STORAGE_KEY);
}
