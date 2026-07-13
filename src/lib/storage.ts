import type { PersistedAppState, TreatmentPlan } from "@/types";
import { DEFAULT_MEDICATIONS } from "@/lib/default-plan";

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
      treatmentPlan: parsed.treatmentPlan
        ? migrateTreatmentPlan(parsed.treatmentPlan)
        : null,
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

/**
 * Syncs the treatment plan's medication list with the current defaults:
 * adds newly introduced medications and removes deprecated ones.
 * Existing dose records and active sessions are left untouched.
 */
export function migrateTreatmentPlan(plan: TreatmentPlan): TreatmentPlan {
  const defaultIds = new Set(DEFAULT_MEDICATIONS.map((m) => m.id));
  const existingIds = new Set(plan.medications.map((m) => m.id));
  const missing = DEFAULT_MEDICATIONS.filter((m) => !existingIds.has(m.id));
  const removed = plan.medications.filter((m) => !defaultIds.has(m.id));

  if (missing.length === 0 && removed.length === 0) {
    return plan;
  }

  const kept = plan.medications.filter((m) => defaultIds.has(m.id));
  return {
    ...plan,
    medications: [...kept, ...missing].sort((a, b) => a.order - b.order),
    updatedAt: new Date().toISOString()
  };
}
