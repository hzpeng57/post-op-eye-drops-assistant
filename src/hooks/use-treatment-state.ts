"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createDefaultTreatmentPlan } from "@/lib/default-plan";
import { addDays, clampNumber, toLocalDateString } from "@/lib/time";
import { generateDailyPlan } from "@/lib/schedule-engine";
import {
  clearAppState,
  createInitialAppState,
  loadAppState,
  saveAppState
} from "@/lib/storage";
import type { ActiveSession, DoseRecord, PersistedAppState, TreatmentPlan } from "@/types";

export function useTreatmentState() {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<PersistedAppState>(() => createInitialAppState());
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setState(loadAppState());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveAppState(state);
    }
  }, [hydrated, state]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (
      !state.activeSession ||
      state.activeSession.status !== "waiting" ||
      !state.activeSession.waitUntil
    ) {
      return;
    }
    const waitUntil = state.activeSession.waitUntil;
    const timeout = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        activeSession:
          current.activeSession?.status === "waiting" && current.activeSession.waitUntil === waitUntil
          ? {
              ...current.activeSession,
              status: "active"
            }
          : current.activeSession
      }));
    }, Math.max(0, new Date(waitUntil).getTime() - now.getTime()));
    return () => window.clearTimeout(timeout);
  }, [now, state.activeSession]);

  const today = toLocalDateString(now);
  const todayPlan = useMemo(
    () => (state.treatmentPlan ? generateDailyPlan(state.treatmentPlan, today) : null),
    [state.treatmentPlan, today]
  );
  const todayRecords = useMemo(
    () => state.doseRecords.filter((record) => record.localDate === today),
    [state.doseRecords, today]
  );

  const initializePlan = useCallback((startDate: string) => {
    const treatmentPlan = createDefaultTreatmentPlan(startDate);
    setState({
      schemaVersion: 1,
      treatmentPlan,
      doseRecords: [],
      activeSession: null,
      generatedAt: new Date().toISOString()
    });
  }, []);

  const updateTreatmentPlan = useCallback((updater: (plan: TreatmentPlan) => TreatmentPlan) => {
    setState((current) => {
      if (!current.treatmentPlan) {
        return current;
      }
      return {
        ...current,
        treatmentPlan: updater(current.treatmentPlan),
        generatedAt: new Date().toISOString()
      };
    });
  }, []);

  const updateSettings = useCallback(
    (settings: Partial<Pick<TreatmentPlan, "startDate" | "wakeTime" | "sleepTime">> & {
      medicationIntervalMinutes?: number;
    }) => {
      updateTreatmentPlan((plan) => ({
        ...plan,
        ...settings,
        medicationIntervalMinutes:
          settings.medicationIntervalMinutes === undefined
            ? plan.medicationIntervalMinutes
            : clampNumber(settings.medicationIntervalMinutes, 3, 15),
        updatedAt: new Date().toISOString()
      }));
    },
    [updateTreatmentPlan]
  );

  const regeneratePlan = useCallback(() => {
    setState((current) => ({
      ...current,
      generatedAt: new Date().toISOString(),
      activeSession: null
    }));
  }, []);

  const resetAll = useCallback(() => {
    clearAppState();
    setState(createInitialAppState());
  }, []);

  const startSession = useCallback((scheduleItemId: string) => {
    setState((current) => ({
      ...current,
      activeSession: {
        scheduleItemId,
        currentStepIndex: 0,
        status: "active",
        startedAt: new Date().toISOString()
      }
    }));
  }, []);

  const completeCurrentStep = useCallback(() => {
    setState((current) => {
      if (!current.treatmentPlan || !current.activeSession) {
        return current;
      }
      const date = toLocalDateString(new Date());
      const plan = generateDailyPlan(current.treatmentPlan, date);
      const item = plan.items.find(
        (candidate) => candidate.id === current.activeSession?.scheduleItemId
      );
      const step = item?.steps[current.activeSession.currentStepIndex];
      if (!item || !step) {
        return { ...current, activeSession: null };
      }
      const existingRecord = current.doseRecords.find(
        (record) => record.scheduleStepId === step.id && record.status === "completed"
      );
      const doseRecord: DoseRecord = {
        id: `dose-${step.id}-${Date.now()}`,
        treatmentPlanId: current.treatmentPlan.id,
        scheduleItemId: item.id,
        scheduleStepId: step.id,
        medicationId: step.medicationId,
        localDate: date,
        scheduledAt: step.scheduledAt,
        completedAt: new Date().toISOString(),
        status: "completed"
      };
      const nextStepIndex = current.activeSession.currentStepIndex + 1;
      const hasNextStep = nextStepIndex < item.steps.length;
      const nextSession: ActiveSession | null = hasNextStep
        ? {
            ...current.activeSession,
            currentStepIndex: nextStepIndex,
            status: "waiting",
            waitUntil: new Date(
              Date.now() + (step.waitAfterMinutes ?? plan.medicationIntervalMinutes) * 60000
            ).toISOString()
          }
        : null;

      return {
        ...current,
        doseRecords: existingRecord ? current.doseRecords : [...current.doseRecords, doseRecord],
        activeSession: nextSession
      };
    });
  }, []);

  const lastSevenPlans = useMemo(() => {
    if (!state.treatmentPlan) {
      return [];
    }
    return Array.from({ length: 7 }, (_, index) =>
      generateDailyPlan(state.treatmentPlan as TreatmentPlan, addDays(today, index - 6))
    );
  }, [state.treatmentPlan, today]);

  return {
    hydrated,
    state,
    now,
    today,
    treatmentPlan: state.treatmentPlan,
    todayPlan,
    todayRecords,
    lastSevenPlans,
    activeSession: state.activeSession,
    initializePlan,
    updateSettings,
    regeneratePlan,
    resetAll,
    startSession,
    completeCurrentStep
  };
}
